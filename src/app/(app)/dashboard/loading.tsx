export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6 animate-pulse">
      {/* Greeting */}
      <div className="flex flex-col gap-1.5">
        <div className="h-6 w-40 bg-dark/8 rounded-full" />
        <div className="h-4 w-24 bg-dark/6 rounded-full" />
      </div>

      {/* CTA button */}
      <div className="h-14 w-full bg-primary/20 rounded-card" />

      {/* Exam countdown */}
      <div className="h-16 w-full bg-dark/6 rounded-card" />

      {/* Score gauge */}
      <div className="bg-white border border-dark/8 rounded-card px-4 py-4 flex flex-col gap-3">
        <div className="h-3 w-28 bg-dark/8 rounded-full" />
        <div className="h-10 w-24 bg-dark/10 rounded-full" />
        <div className="h-3 w-full bg-dark/8 rounded-full" />
      </div>

      {/* Weekly goal */}
      <div className="bg-white border border-dark/8 rounded-card px-4 py-4 flex flex-col gap-3">
        <div className="h-3 w-32 bg-dark/8 rounded-full" />
        <div className="h-2.5 w-full bg-dark/6 rounded-full" />
        <div className="h-2.5 w-full bg-dark/6 rounded-full" />
      </div>

      {/* Streak calendar */}
      <div className="bg-white border border-dark/8 rounded-card px-4 py-4 flex flex-col gap-3">
        <div className="h-3 w-36 bg-dark/8 rounded-full" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded bg-dark/6" />
          ))}
        </div>
      </div>
    </div>
  )
}
