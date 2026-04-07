"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database"
import { 
  ArrowLeft, 
  Activity, 
  Clock, 
  FileText, 
  BrainCircuit, 
  ChevronRight,
  Loader2,
  Zap
} from "lucide-react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"

type Patient = Database['public']['Tables']['patients']['Row']
type ShiftNote = Database['public']['Tables']['shift_notes']['Row'] & {
  standardized_assessments?: (Database['public']['Tables']['standardized_assessments']['Row'] & {
    clinical_evidence: string
    analytical_rationale: string
  })[]
}

export default function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [notes, setNotes] = useState<ShiftNote[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    // 1. Fetch Patient
    const { data: p, error: pError } = await (supabase.from('patients') as any).select('*').eq('id', id).single()
    if (!pError && p) setPatient(p)

    // 2. Fetch Notes and Assessments
    const { data: n, error: nError } = await (supabase
      .from('shift_notes') as any)
      .select('*, standardized_assessments(*)')
      .eq('patient_id', id)
      .order('timestamp', { ascending: false })
    
    if (!nError && n) setNotes(n as ShiftNote[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleStandardize = async (noteId: string) => {
    setProcessing(noteId)
    try {
      const res = await fetch('/api/standardize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId })
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(null)
    }
  }

  const getChartData = () => {
    if (!notes.length || !patient) return []
    // Combine base risk and deltas chronologically
    let currentTotal = patient.base_risk_score
    const chronNotes = [...notes].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    return chronNotes.map((n, i) => {
      const assessment = n.standardized_assessments?.[0]
      if (assessment) {
        currentTotal += assessment.calculated_risk_delta
      }
      return {
        time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        risk: Math.min(100, currentTotal)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="animate-spin h-8 w-8 opacity-50" />
      </div>
    )
  }

  if (!patient) return <div>Patient not found</div>

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back and Navigation */}
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hover:bg-muted font-mono tracking-tight text-xs"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Registry
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="mono-metrics text-xs opacity-60">ID: {patient.id.slice(0, 8)}</Badge>
            <Badge variant="outline" className="mono-metrics text-xs opacity-60">Room: {patient.room_number}</Badge>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase">{patient.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground uppercase tracking-widest text-[10px] font-mono">
              <span>Patient Profile</span>
              <Separator orientation="vertical" className="h-2" />
              <span>Skilled Nursing Facility Care Plan</span>
            </div>
          </div>
          <div className="flex flex-row items-center gap-8">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Baseline</p>
              <p className="mono-metrics text-xl opacity-60">{patient.base_risk_score}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Current Risk</p>
              <p className={`mono-metrics text-5xl font-black ${patient.current_risk_score >= 70 ? 'text-rose-500' : patient.current_risk_score >= 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {patient.current_risk_score}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Timeline - Left Column */}
          <div className="lg:col-span-12">
             <Card className="border-border bg-card">
               <CardHeader className="border-b border-border">
                 <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Activity className="h-4 w-4" /> 48-Hour Clinical Trajectory
                 </CardTitle>
               </CardHeader>
               <CardContent className="pt-6">
                 <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={patient.current_risk_score >= 70 ? "#ef4444" : "#10b981"} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={patient.current_risk_score >= 70 ? "#ef4444" : "#10b981"} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a2a" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666', fontFamily: 'monospace'}} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666', fontFamily: 'monospace'}} />
                        <Tooltip 
                           contentStyle={{backgroundColor: '#121212', border: '1px solid #333', borderRadius: '4px', fontSize: '10px'}}
                           cursor={{stroke: '#444', strokeWidth: 1}}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="risk" 
                          stroke={patient.current_risk_score >= 70 ? "#ef4444" : "#10b981"} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRisk)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
          </div>

          {/* Shift Notes - Details */}
          <div className="lg:col-span-12 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest border-l-2 border-primary pl-4 mb-4">Patient Log // Unstructured Data Pipeline</h3>
            
            {notes.map((note) => {
              const assessment = note.standardized_assessments?.[0]
              return (
                <div key={note.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Raw Text */}
                  <Card className="border-border bg-card/50">
                    <CardHeader className="py-3 bg-muted/20 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                        <Clock className="h-3 w-3" />
                        {new Date(note.timestamp).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">Raw Note</Badge>
                    </CardHeader>
                    <CardContent className="py-4">
                      <p className="text-sm leading-relaxed text-muted-foreground italic">&ldquo;{note.raw_text}&rdquo;</p>
                      
                      {!note.ai_processed && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="mt-4 w-full h-8 text-[10px] font-bold uppercase tracking-widest"
                          onClick={() => handleStandardize(note.id)}
                          disabled={processing === note.id}
                        >
                          {processing === note.id ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
                          Process clinical flags
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* AI Structured Intelligence */}
                  <Card className={`border-border ${assessment ? 'bg-card opacity-100 shadow-md border-primary/20' : 'bg-muted/10 opacity-40'}`}>
                    <CardHeader className="py-3 bg-primary/10 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest font-black">
                        <BrainCircuit className="h-3 w-3" />
                        Clinical Intelligence Engine
                      </div>
                      {assessment && (
                        <div className="flex items-center gap-1 font-mono font-black text-rose-500 text-sm italic">
                          +{assessment.calculated_risk_delta} RISK DELTA
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="py-4 min-h-[140px]">
                      {assessment ? (
                        <div className="space-y-4">
                          {/* Categorized Indicators */}
                          <div className="flex flex-wrap gap-2 pb-3 border-b border-white/5">
                             <FlagBadge label="Cognitive" active={assessment.cognitive_flag} />
                             <FlagBadge label="Metabolic" active={assessment.appetite_flag} />
                             <FlagBadge label="Physical" active={assessment.mobility_flag} />
                          </div>

                          {/* Evidence & Rationale */}
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                               <p className="text-[9px] uppercase font-bold text-primary tracking-widest mb-1 opacity-70">Clinical Evidence</p>
                               <p className="text-xs font-mono leading-tight bg-black/30 p-2 rounded border border-white/5 italic underline decoration-primary/30 underline-offset-4 font-bold">
                                 {assessment.clinical_evidence}
                               </p>
                            </div>
                            <div>
                               <p className="text-[9px] uppercase font-bold text-amber-500 tracking-widest mb-1 opacity-70">Analytical Rationale</p>
                               <p className="text-xs leading-relaxed text-muted-foreground font-medium border-l-2 border-amber-500/50 pl-3">
                                 {assessment.analytical_rationale}
                               </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                          <p className="text-[10px] uppercase text-muted-foreground tracking-widest italic opacity-40">Intelligence Layer Offline // Awaiting Protocol</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlagBadge({ label, active }: { label: string, active: boolean }) {
  return (
    <Badge 
      variant={active ? "destructive" : "secondary"} 
      className={`text-[9px] uppercase tracking-widest px-2 py-0.5 border ${active ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-muted opacity-40 border-transparent'}`}
    >
      {label} {active ? '!!' : '--'}
    </Badge>
  )
}
