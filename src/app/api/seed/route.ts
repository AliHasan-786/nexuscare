import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // 1. Clear existing data (optional for demo, but better for fresh start)
    // In a real app, you might not do this, but for a "Seed" button on an empty dashboard:
    const { error: clearError } = await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (clearError) throw new Error(`Clear error: ${clearError.message}`)

    // 2. Define Mock Patients
    const mockPatients = [
      { name: 'A. Johnson', room_number: '101-A', base_risk_score: 10, current_risk_score: 85, status: 'critical' as const },
      { name: 'M. Smith', room_number: '204-B', base_risk_score: 5, current_risk_score: 45, status: 'monitoring' as const },
      { name: 'J. Doe', room_number: '112-C', base_risk_score: 0, current_risk_score: 20, status: 'stable' as const },
      { name: 'R. Garcia', room_number: '301-A', base_risk_score: 15, current_risk_score: 15, status: 'stable' as const },
      { name: 'S. Wilson', room_number: '215-B', base_risk_score: 10, current_risk_score: 60, status: 'monitoring' as const },
    ]

    const { data: patients, error: patientError } = await (supabase
      .from('patients') as any)
      .insert(mockPatients)
      .select()

    if (patientError || !patients) throw new Error(`Patient seed error: ${patientError?.message}`)

    // 3. Define Shift Notes for the "Declining" Patient (A. Johnson)
    const johnson = (patients as any[]).find(p => p.name === 'A. Johnson')!
    const notesJson: any[] = [
      { patient_id: johnson.id, raw_text: "Pt A/O x1 only. C/o late wife (dec.). Intake 50% lunch. Fatigue ↑.", timestamp: new Date(Date.now() - 48 * 3600000).toISOString() },
      { patient_id: johnson.id, raw_text: "Refused morning MDs. Mobility ↓, pt reluctant to ambulate. Pain 6/10.", timestamp: new Date(Date.now() - 36 * 3600000).toISOString() },
      { patient_id: johnson.id, raw_text: "Vitals: Pulse Ox 91% on RA. C/o dyspnea. Agitated during evening check.", timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
      { patient_id: johnson.id, raw_text: "Intake < 25%. Refused all nutrition. Sundowning noted. Agitation ↑.", timestamp: new Date(Date.now() - 12 * 3600000).toISOString() },
      { patient_id: johnson.id, raw_text: "Cognitive decline compounding. Unresponsive to verbal cues. Fall risk ↑↑.", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    ]

    // Add some random notes for others
    (patients as any[]).filter(p => p.id !== johnson.id).forEach(p => {
      notesJson.push({
        patient_id: p.id,
        raw_text: "Vitals stable. Pt resting comfortably. Good appetite noted during dinner.",
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
      })
    })

    const { error: notesError } = await (supabase
      .from('shift_notes') as any)
      .insert(notesJson)

    if (notesError) throw new Error(`Notes seed error: ${notesError.message}`)

    return NextResponse.json({ success: true, message: "Sandbox initialized with 5 patients and clinical notes." })
  } catch (error: any) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
