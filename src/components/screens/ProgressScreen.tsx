import { TrendingUp, Award, Target, Clock, Flame } from "lucide-react";

const days = [
  { d: "M", v: 60 }, { d: "T", v: 80 }, { d: "W", v: 45 },
  { d: "T", v: 90 }, { d: "F", v: 70 }, { d: "S", v: 100 }, { d: "S", v: 55 },
];

const stats = [
  { icon: Clock, label: "Hours", value: "24h", color: "text-primary-glow" },
  { icon: Award, label: "Badges", value: "12", color: "text-accent" },
  { icon: Target, label: "Accuracy", value: "87%", color: "text-orange-400" },
];

export const ProgressScreen = () => (
  <div className="flex-1 flex flex-col overflow-hidden">
    <div className="px-5 pt-12 pb-3">
      <p className="text-xs text-muted-foreground">Your journey</p>
      <h2 className="text-2xl font-display font-bold">Progress</h2>
    </div>

    <div className="flex-1 px-5 overflow-y-auto scrollbar-hide pb-5 space-y-4">
      {/* Streak hero */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-br from-orange-500 via-primary to-violet-600 overflow-hidden">
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/80 uppercase tracking-widest">Current Streak</p>
            <p className="text-4xl font-display font-bold text-white mt-1">7 days</p>
            <p className="text-[11px] text-white/80 mt-0.5">Keep it up! 🔥</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Flame className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-display font-semibold">This Week</p>
            <p className="text-[10px] text-muted-foreground">+18% vs last week</p>
          </div>
          <div className="flex items-center gap-1 text-accent">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">+18%</span>
          </div>
        </div>
        <div className="flex items-end justify-between h-24 gap-1.5">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-lg bg-gradient-to-t from-primary to-primary-glow transition-all"
                style={{ height: `${d.v}%` }} />
              <span className="text-[9px] text-muted-foreground font-medium">{d.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-3 text-center">
            <s.icon className={`w-4 h-4 mx-auto ${s.color}`} />
            <p className="text-base font-display font-bold mt-1.5">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div>
        <p className="text-xs font-display font-semibold mb-2">Recent Achievements</p>
        <div className="space-y-2">
          {[
            { e: "🎯", t: "Perfect Quiz", s: "100% on Calculus" },
            { e: "📚", t: "Bookworm", s: "10 lessons completed" },
          ].map((a) => (
            <div key={a.t} className="glass-card rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center text-lg">
                {a.e}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">{a.t}</p>
                <p className="text-[10px] text-muted-foreground">{a.s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
