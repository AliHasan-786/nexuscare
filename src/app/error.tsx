'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Nexus Operational Error:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
        <AlertCircle className="h-10 w-10" />
      </div>
      
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground leading-none">
          System Interrupted
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The simulation encountered a protocol error. This usually occurs during a database connection timeout or a failure in the standardization extraction layer.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button 
            onClick={() => reset()}
            className="w-full sm:w-auto font-bold uppercase tracking-widest text-[11px]"
          >
            <RefreshCcw className="mr-2 h-3 w-3" /> Reconnect Protocol
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button 
              variant="outline"
              className="w-full sm:w-auto font-bold uppercase tracking-widest text-[11px]"
            >
              <Home className="mr-2 h-3 w-3" /> Return to Hub
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 text-[9px] uppercase tracking-widest text-muted-foreground/30 font-mono">
        Error Digest: {error.digest || 'Unknown Protocol Failure'}
      </div>
    </div>
  )
}
