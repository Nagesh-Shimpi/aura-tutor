import { Sparkles, BookOpen, Atom, Code2, Languages, Bell, ArrowRight } from "lucide-react";

const recommended = [
  { icon: Atom, label: "Quantum Basics", color: "from-violet-500 to-fuchsia-500" },
  { icon: Code2, label: "Python 101", color: "from-blue-500 to-cyan-400" },
  { icon: Languages, label: "Spanish", color: "from-pink-500 to-rose-400" },
];

export const HomeScreen = () => (
  <div className="flex-1 flex flex-col overflow-hidden">
    <div className="px-5 pt-12 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">N</div>
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <p className="text-sm font-display font-bold">Hi Nagesh 👋</p>
        </div>
      </div>
      <div className="glass w-9 h-9 rounded-full flex items-center justify-center relative">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
      </div>
    </div>

    <div className="px-5 mt-3 overflow-y-auto scrollbar-hide pb-6 space-y-5">
      {/* Quick Start Chat */}
      <div className="relative rounded-3xl p-5 bg-gradient-primary overflow-hidden shadow-[0_15px_40px_-10px_hsl(258_90%_66%/0.5)]">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        <Sparkles className="w-6 h-6 text-white mb-3" />
        <h3 className="text-white font-display font-bold text-lg leading-tight">Ask anything,<br/>learn anything</h3>
        <button className="mt-4 bg-white text-primary text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5">
          Quick Start Chat <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Continue Learning */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-sm font-display font-semibold">Continue Learning</h4>
          <span className="text-xs text-primary-glow">See all</span>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-violet flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Calculus: Derivatives</p>
              <p className="text-[10px] text-muted-foreground">Chapter 3 · Lesson 4</p>
            </div>
            <span className="text-xs font-bold text-primary-glow">68%</span>
          </div>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[68%] bg-gradient-primary rounded-full" />
          </div>
        </div>
      </div>

      {/* Recommended */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-sm font-display font-semibold">Recommended</h4>
          <span className="text-xs text-primary-glow">Browse</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {recommended.map((r) => (
            <div key={r.label} className="glass-card rounded-2xl p-3 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center`}>
                <r.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-[11px] font-semibold leading-tight">{r.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom nav */}
    <div className="px-5 pb-4">
      <div className="glass rounded-full px-5 py-3 flex items-center justify-around">
        {["Home","Learn","Chat","Stats"].map((t,i)=>(
          <div key={t} className={`text-[10px] font-semibold ${i===0?"text-primary-glow":"text-muted-foreground"}`}>{t}</div>
        ))}
      </div>
    </div>
  </div>
);
