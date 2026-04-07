import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openaiApiKey = process.env.OPENAI_API_KEY
if (!openaiApiKey) {
  console.warn("Nexus CareSight: OPENAI_API_KEY missing. Clinical standardization logic will be unavailable.")
}
const openai = new OpenAI({ 
  apiKey: openaiApiKey || 'placeholder-key',
  baseURL: "https://openrouter.ai/api/v1"
})

export async function POST(req: Request) {
  try {
    const { noteId } = await req.json()
    if (!noteId) throw new Error('No note ID provided.')

    // Fetch the raw note
    const { data, error: noteError } = await supabase
      .from('shift_notes')
      .select('*, patients(*)')
      .eq('id', noteId)
      .single()

    if (noteError || !data) throw new Error(`Note fetch error: ${noteError?.message}`)
    
    // Cast to any to handle complex Postgrest join types in this prototype
    const note = data as any

    // 1. Process with LLM
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior clinical analyst for a Medicare Advantage ACO. Your job is to extract high-risk markers from messy clinical shorthand. Focus on Evidence and Rationale. Respond ONLY with valid JSON."
        },
        {
          role: "user",
          content: `Analyze this clinical note: "${note.raw_text}"
          
          Schema Requirement:
          {
            "cognitive_decline": boolean,
            "appetite_loss": boolean,
            "mobility_change": boolean,
            "risk_score_delta": integer,
            "clinical_evidence": string (Strict medical evidence found in text),
            "logic_rationale": string (Analytical reasoning for the risk score change. e.g., 'Infection risk ↑ due to cognitive decline + poor intake')
          }`
        }
      ],
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content!)

    // 2. Insert into standardized_assessments
    const { error: assessmentError } = await supabase
      .from('standardized_assessments')
      .insert({
        note_id: noteId,
        cognitive_flag: result.cognitive_decline,
        appetite_flag: result.appetite_loss,
        mobility_flag: result.mobility_change,
        calculated_risk_delta: result.risk_score_delta,
        clinical_evidence: result.clinical_evidence,
        analytical_rationale: result.logic_rationale
      } as any)

    if (assessmentError) throw new Error(`Assessment insert error: ${assessmentError.message}`)

    // 3. Update patient's current risk score
    const currentRisk = note.patients?.current_risk_score || 0
    const newRiskScore = Math.min(100, currentRisk + result.risk_score_delta)
    let status: 'stable' | 'monitoring' | 'critical' = 'stable'
    if (newRiskScore >= 70) status = 'critical'
    else if (newRiskScore >= 30) status = 'monitoring'

    const { error: updateError } = await supabase
      .from('patients')
      .update({
        current_risk_score: newRiskScore,
        status: status
      } as any)
      .eq('id', note.patient_id)

    if (updateError) throw new Error(`Patient update error: ${updateError.message}`)

    // 4. Mark note as processed
    await supabase.from('shift_notes').update({ ai_processed: true } as any).eq('id', noteId)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("Standardization API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
