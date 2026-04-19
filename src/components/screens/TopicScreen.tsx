import { ArrowLeft, Bookmark, Play, CheckCircle2, Circle } from "lucide-react";

const lessons = [
  { title: "Introduction to Derivatives", duration: "8 min", done: true },
  { title: "The Power Rule", duration: "12 min", done: true },
  { title: "Chain Rule Explained", duration: "15 min", done: false, current: true },
  { title: "Product & Quotient Rules", duration: "10 min", done: false },
  { title: "Practice Problems", duration: "20 min", done: false },
];

export const TopicScreen = () => (
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Hero */}
    <div className="relative h-48 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-primary to-accent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_40%)] opacity-20" />
      <div className="relative z-10 px-5 pt-12 flex items-center justify-between">
        <div className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </div>
        <div className="w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
          <Bookmark className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="absolute bottom-4 left-5 right-5">
        <p className="text-[10px] text-white/70 uppercase tracking-widest">Mathematics</p>
        <h2 className="text-2xl font-display font-bold text-white leading-tight mt-1">Calculus<br/>Derivatives</h2>
      </div>
    </div>

    <div className="flex-1 px-5 pt-4 overflow-y-auto scrollbar-hide pb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">5 lessons · 65 min</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-[40%] bg-gradient-primary" />
            </div>
            <span className="text-[10px] font-bold text-primary-glow">2 / 5</span>
          </div>
        </div>
        <button className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-[0_10px_30px_-8px_hsl(258_90%_66%/0.6)]">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </button>
      </div>

      <h4 className="text-sm font-display font-semibold mb-2.5">Lessons</h4>
      <div className="space-y-2">
        {lessons.map((l, i) => (
          <div key={i} className={`glass-card rounded-2xl p-3 flex items-center gap-3 ${l.current ? "ring-1 ring-primary/50" : ""}`}>
            {l.done ? (
              <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            ) : (
              <Circle className={`w-5 h-5 flex-shrink-0 ${l.current ? "text-primary-glow" : "text-muted-foreground"}`} />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold truncate ${l.done ? "text-muted-foreground line-through" : ""}`}>{l.title}</p>
              <p className="text-[10px] text-muted-foreground">{l.duration}</p>
            </div>
            {l.current && (
              <span className="text-[9px] font-bold text-primary-glow bg-primary/10 px-2 py-0.5 rounded-full">NOW</span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
