import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="p-6 min-h-screen bg-background text-foreground">
      {/* Simulation HUD Skeleton */}
      <div className="sticky top-0 z-50 w-full border-b border-primary/20 bg-primary/5 backdrop-blur-md py-2 px-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32 hidden md:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="space-y-2">
               <Skeleton className="h-6 w-48" />
               <Skeleton className="h-3 w-32" />
             </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-6 border-b border-border space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="p-6 space-y-4">
             {[...Array(6)].map((_, i) => (
               <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                 <Skeleton className="h-4 w-12" />
                 <Skeleton className="h-6 w-20" />
                 <Skeleton className="h-4 w-16" />
                 <Skeleton className="h-6 w-8" />
                 <Skeleton className="h-8 w-24" />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}
