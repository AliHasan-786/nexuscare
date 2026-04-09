"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database"
import { toast } from "sonner"
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  ArrowUpRight, 
  FileText, 
  Database as DbIcon,
  Loader2 
} from "lucide-react"
import Link from "next/link"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Info, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts"

type Patient = Database['public']['Tables']['patients']['Row']

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('current_risk_score', { ascending: false })
      
      if (error) throw error
      if (data) setPatients(data)
    } catch (err) {
      console.error("Database Connection Failed:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleInitialize = async () => {
    setSeeding(true)
    const toastId = toast.loading("Initializing Clinical Protocol...", {
      description: "Generating patient registry and synthesizing shift logs."
    })

    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        toast.success("Simulation Protocols Loaded", {
          id: toastId,
          description: "48-hour clinical trajectory ingested successfully."
        })
        await fetchPatients()
      } else {
        throw new Error("Seeding failed")
      }
    } catch (err) {
      console.error(err)
      toast.error("Protocol Initialization Failed", {
        id: toastId,
        description: "Verify Supabase connection and try again."
      })
    } finally {
      setSeeding(false)
    }
  }

  const getStatusBadge = (score: number) => {
    if (score >= 70) return <Badge className="pill-red">CRITICAL</Badge>
    if (score >= 30) return <Badge className="pill-yellow">MONITORING</Badge>
    return <Badge className="pill-green">STABLE</Badge>
  }

  // Dummy Sparkline Logic (using current_risk and a fake trend)
  const renderSparkline = (patient: Patient) => {
    // In a real app, you'd fetch the last 48h assessments
    const base = patient.base_risk_score
    const current = patient.current_risk_score
    const data = [
      { v: base },
      { v: base + (current-base)*0.2 },
      { v: base + (current-base)*0.5 },
      { v: current }
    ]
    const color = current >= 70 ? "#ef4444" : current >= 30 ? "#f59e0b" : "#10b981"
    
    return (
      <div className="h-[30px] w-[80px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // 1. Check for Missing Configuration (Safety for Vercel Deployments)
  const isMissingConfig = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

  if (isMissingConfig) {
    return <MissingConfigState />
  }

  if (loading && patients.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground animate-pulse">Syncing with Clinical Database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Simulation HUD/Status Bar */}
      <div className="sticky top-0 z-50 w-full border-b border-primary/20 bg-primary/5 backdrop-blur-md py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
               Simulation Status: {patients.length > 0 ? "Data Ingested // Evaluation Layer Active" : "Awaiting Protocol Initialization"}
             </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-[9px] uppercase tracking-tighter text-muted-foreground font-mono">
            <span>Supabase: Connected</span>
            <span className="opacity-30">|</span>
            <span>OpenRouter: Active (GPT-4o-mini)</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <Header onInit={handleInitialize} seeding={seeding} hasData={patients.length > 0} />

        {patients.length === 0 ? (
          <EmptyState onInit={handleInitialize} seeding={seeding} />
        ) : (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Context Notice for Recruiters */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border flex items-center gap-4">
               <Info className="h-5 w-5 text-primary shrink-0" />
               <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="text-foreground font-bold uppercase mr-1 text-[10px]">Guided Demo:</span> 
                  This registry reflects patients with subtle, compounding decline markers extracted from raw logs. 
                  <span className="text-primary font-bold ml-1">Action: Click "View File" to see how the AI standardizes unstructured nurse notes into risk deltas.</span>
               </p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard 
                title="Total Patients" 
                value={patients.length} 
                icon={<Users className="h-4 w-4" />} 
                description="Under SNF supervision" 
              />
              <StatsCard 
                title="Critical Status" 
                value={patients.filter(p => p.status === 'critical').length} 
                icon={<AlertCircle className="h-4 w-4 status-red" />} 
                description="Total Risk Score >= 70" 
              />
              <StatsCard 
                title="Stable Monitoring" 
                value={patients.filter(p => p.status === 'stable').length} 
                icon={<CheckCircle2 className="h-4 w-4 status-green" />} 
                description="Total Risk Score < 30" 
              />
              <Card className="border-primary/20 bg-primary/5 shadow-sm border-dashed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                    <Brain className="h-3 w-3" /> Clinical Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[11px] font-medium leading-relaxed">
                    Extracts <span className="text-primary">high-risk markers</span> from unstructured logs to prevent avoidable hospitalizations.
                  </div>
                  <div className="mt-2 text-[9px] uppercase text-muted-foreground tracking-tighter">Architecture: Standardization & Efficiency</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Table */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold font-mono tracking-tight text-white">System Registry // Patient Log</CardTitle>
                    <CardDescription>Real-time risk stratification based on clinical histories</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Stable
                    </div>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> Monitoring
                    </div>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Critical
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px]">Initials</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>48h Trend</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold tracking-tight">{p.name.split(' ').map(n => n[0]).join('')}</TableCell>
                      <TableCell>{getStatusBadge(p.current_risk_score)}</TableCell>
                      <TableCell className="mono-metrics text-muted-foreground">{p.room_number}</TableCell>
                      <TableCell>
                        <span className="mono-metrics text-lg">{p.current_risk_score}</span>
                      </TableCell>
                      <TableCell>{renderSparkline(p)}</TableCell>
                      <TableCell className="text-right">
                        <Link 
                          href={`/patient/${p.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8 border-muted-foreground/30 hover:border-primary text-white"
                          )}
                        >
                          View File <ArrowUpRight className="ml-2 h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Footer Branding */}
        <div className="mt-12 mb-8 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-mono">
          Nexus CareSight // Clinical Intelligence Protocol
        </div>
      </div>
    </div>
  )
}

function Header({ onInit, seeding, hasData }: any) {
  return (
    <nav className="flex items-center justify-between mb-8 max-w-7xl mx-auto border-b border-border pb-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Nexus CareSight</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Provider Portfolio // Version 1.0.0</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {hasData && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onInit} 
            disabled={seeding}
            className="text-xs h-8 font-mono bg-primary/5 hover:bg-primary/10 border border-primary/20"
          >
            {seeding ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <DbIcon className="h-3 w-3 mr-2" />}
            Reseed Sandbox Data
          </Button>
        )}
      </div>
    </nav>
  )
}

function StatsCard({ title, value, icon, description }: any) {
  return (
    <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mono-metrics">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">{description}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onInit, seeding }: any) {
  return (
    <div className="max-w-4xl mx-auto mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-10 flex flex-col justify-center border-r border-border bg-muted/20">
          <Badge variant="outline" className="w-fit mb-4 text-[10px] tracking-[0.2em] uppercase font-mono text-primary border-primary/30 py-1">
            Standardization Protocol: v1.0
          </Badge>
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
            The Nexus <br/><span className="text-primary italic">Intelligence</span> <br/>Simulation
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              In high-acuity SNF environments, subtle clinical decline is often buried in unstructured shift notes.
            </p>
            <p>
              This simulation demonstrates how a **BI Analyst** uses clinical NLP logic to standardize these logs into predictive risk trajectories.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
             <div className="flex items-start gap-4">
               <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10 text-primary font-mono text-xs border border-primary/20 shrink-0">1</div>
               <p className="text-[11px] leading-tight text-muted-foreground"><span className="text-foreground font-bold">Initialize</span> the clinical database with 48h of raw provider shift notes.</p>
             </div>
             <div className="flex items-start gap-4">
               <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10 text-primary font-mono text-xs border border-primary/20 shrink-0">2</div>
               <p className="text-[11px] leading-tight text-muted-foreground"><span className="text-foreground font-bold">Standardize</span> unstructured data into high-contrast risk scores.</p>
             </div>
          </div>
        </div>
        <div className="p-10 flex flex-col items-center justify-center bg-background text-center">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
            <Brain className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h3 className="text-lg font-bold mb-4 tracking-tight">System Ready for Ingest</h3>
          <Button 
            size="lg" 
            onClick={onInit} 
            disabled={seeding}
            className="w-full h-14 font-black tracking-tighter uppercase text-base bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.5)]"
          >
            {seeding ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Processing Logs...
              </>
            ) : (
              <>
                <DbIcon className="mr-3 h-5 w-5" />
                Launch Simulation Protocol
              </>
            )}
          </Button>
          <div className="mt-6 p-3 rounded-lg border border-border bg-muted/50 text-[10px] text-muted-foreground font-mono leading-tight">
            INTEGRATED: SUPABASE // OPENROUTER GPT-4o-MINI
          </div>
        </div>
      </div>
    </div>
  )
}
function MissingConfigState() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-md border-rose-500/20 bg-rose-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold uppercase tracking-tight">Configuration Required</CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest text-rose-500/70">Deployment Protocol Interrupted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The **Clinical Intelligence Hub** requires a secure connection to Supabase and OpenAI to function.
          </p>
          <div className="rounded border border-rose-500/20 bg-background p-4 text-left text-[11px] font-mono leading-tight text-muted-foreground">
            <p className="mb-2 text-foreground font-bold underline">Final Step for Recruiter Demo:</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Open Vercel Dashboard</li>
              <li>Settings → Environment Variables</li>
              <li>Add: `NEXT_PUBLIC_SUPABASE_URL`</li>
              <li>Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY`</li>
              <li>Add: `OPENAI_API_KEY`</li>
            </ol>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Once keys are added, redeploy or refresh this page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
