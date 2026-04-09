import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'
import { calculateNewRiskScore, determinePatientStatus } from '@/lib/clinical-utils'

const openaiApiKey = process.env.OPENAI_API_KEY
if (!openaiApiKey) {
  console.warn("Nexus CareSight: OPENAI_API_KEY missing. Clinical standardization logic will be unavailable.")
}
const openai = new OpenAI({ 
  apiKey: openaiApiKey || 'placeholder-key',
  baseURL: "https://openrouter.ai/api/v1",
  maxRetries: 3,
  timeout: 30000, // 30 second timeout
})

export async function POST(req: Request) {
  console.log("--- Nexus Standardization Protocol Started ---")
  console.log("Key Fragment:", openaiApiKey ? `${openaiApiKey.substring(0, 12)}...` : "MISSING")
  try {
    const { noteId } = await req.json()
    if (!noteId) throw new Error('No note ID provided.')

    // Fetch the raw note
    const { data, error: noteError } = await supabase
      .from('shift_notes')
      .select('*, patients(*)')
      .eq('id', noteId)
      .single()

    if (noteError || !data) {
      console.error("SUPABASE DATA FETCH FAILED:", noteError?.message || "No data found")
      throw new Error(`Note fetch error: ${noteError?.message}`)
    }
    
    console.log("Supabase Data Fetched Successfully for noteId:", noteId)
    const note = data as any

    // 1. Process with Raw Fetch to OpenRouter
    console.log("Dispatching Raw Fetch to OpenRouter...")
    const rawResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Nexus Clinical Intelligence"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a senior clinical analyst for a Medicare Advantage ACO. Your job is to extract high-risk markers from messy clinical shorthand. Respond ONLY with valid JSON."
          },
          {
            role: "user",
            content: `Analyze this clinical note: "${note.raw_text}"\n\nSchema: {cognitive_decline: boolean, appetite_loss: boolean, mobility_change: boolean, risk_score_delta: number, clinical_evidence: string, logic_rationale: string}`
          }
        ],
        response_format: { type: "json_object" }
      })
    })

    if (!rawResponse.ok) {
      const errorText = await rawResponse.text()
      console.error("OPENROUTER API REJECTED REQUEST:", errorText)
      throw new Error(`OpenRouter Error: ${rawResponse.status} - ${errorText}`)
    }

    const json = await rawResponse.json()
    const result = json.choices[0].message.content ? JSON.parse(json.choices[0].message.content) : {}

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

    // 3. Update Patient Risk Score
    const patientData = note.patients as any
    const newRiskScore = calculateNewRiskScore(patientData?.current_risk_score || 0, result.risk_score_delta || 0)
    const status = determinePatientStatus(newRiskScore)

    const { error: updateError } = await (supabase
      .from('patients') as any)
      .update({
        current_risk_score: newRiskScore,
        status: status
      } as any)
      .eq('id', note.patient_id)

    if (updateError) throw new Error(`Patient update error: ${updateError.message}`)

    // 4. Mark note as processed
    await (supabase.from('shift_notes') as any).update({ ai_processed: true } as any).eq('id', noteId)

    console.log("OpenRouter Response Received Successfully")
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error.message)
    if (error.response) {
      console.error("OpenRouter Error Details:", error.response.data)
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
