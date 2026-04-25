import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Sparkles, ArrowRight, MessageCircle, User as UserIcon,
  CheckCircle2, Trophy, BookOpen, Brain, Zap, Target,
  Leaf, Flower2, Sun,
} from "lucide-react";

type NatureTheme = "leafy" | "blossom" | "cream";
const THEME_KEY = "lumina_nature_theme_v1";
const THEMES: { id: NatureTheme; label: string; icon: any; chip: string; ring: string }[] = [
  { id: "leafy",   label: "Leafy",   icon: Leaf,    chip: "bg-emerald-500/20 text-emerald-200", ring: "ring-emerald-300" },
  { id: "blossom", label: "Blossom", icon: Flower2, chip: "bg-pink-500/20 text-pink-200",       ring: "ring-pink-300" },
  { id: "cream",   label: "Cream",   icon: Sun,     chip: "bg-amber-500/20 text-amber-200",     ring: "ring-amber-300" },
];

const Landing = () => {
  const navigate = useNavigate();
  const goApp = () => navigate("/app");
  const [theme, setTheme] = useState<NatureTheme>(() => {
    if (typeof window === "undefined") return "blossom";
    const saved = localStorage.getItem(THEME_KEY) as NatureTheme | null;
    return saved && THEMES.some(t => t.id === saved) ? saved : "blossom";
  });
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  return (
    <main className={`min-h-screen w-full text-foreground overflow-x-hidden relative animated-hero-bg nature-theme theme-${theme}`}>
      {/* Floating ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="nt-blob-1 absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl animate-blob" />
        <div className="nt-blob-4 absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        <div className="nt-blob-2 absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full blur-3xl animate-blob" style={{ animationDelay: "8s" }} />
      </div>

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(258_90%_66%/0.6)]">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Lumina</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <button onClick={goApp} className="hover:text-foreground transition-colors text-base">Quiz</button>
          <button onClick={goApp} className="hover:text-foreground transition-colors text-base">Profile</button>
          <button onClick={goApp} className="hover:text-foreground transition-colors text-base">Chatbot</button>
          <button onClick={goApp} className="hover:text-foreground transition-colors text-base">How it works</button>
        </nav>
        <div className="flex items-center gap-2">
          {/* Theme switcher */}
          <div className="hidden sm:flex items-center gap-1 glass rounded-full p-1">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    active ? `${t.chip} ring-2 ${t.ring}` : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={`${t.label} theme`}
                  aria-pressed={active}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={goApp}
            className="nt-accent-gradient text-white text-sm font-semibold rounded-full px-5 py-2.5 hover:scale-[1.03] transition-transform shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)]"
          >
            Open App
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pt-12 md:pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 glass rounded-full px-3.5 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">AI tutor · 2026</span>
          </div>
          <h1 className="font-display font-bold tracking-tight leading-[1.02] text-[2.6rem] sm:text-5xl md:text-6xl lg:text-7xl">
            Learn smarter, <br />
            master every{" "}
            <span className="bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              topic
            </span>
            <span className="text-primary-glow">.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Quizzes that adapt, a chatbot that remembers, and a profile that tracks your real progress —
            all in one place.
          </p>

          <div className="mt-7">
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground/80 font-semibold mb-3">BUILT FOR:</p>
            <div className="flex flex-wrap gap-2">
              {["Curious learners", "Students", "Self-taught devs"].map((t) => (
                <span key={t} className="glass rounded-full px-4 py-1.5 text-sm text-foreground/90">{t}</span>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={goApp}
              className="bg-gradient-primary text-white font-semibold rounded-full pl-6 pr-5 py-3.5 flex items-center gap-2 hover:scale-[1.03] transition-transform shadow-[0_15px_40px_-15px_hsl(258_90%_66%/0.7)]"
            >
              Start learning <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: floating product cards */}
        <div className="relative h-[520px] sm:h-[560px] mt-4 lg:mt-0">
          {/* Quiz card */}
          <div className="absolute top-0 right-2 sm:right-8 w-[260px] sm:w-[300px] glass-card rounded-2xl p-4 shadow-[0_20px_50px_-20px_hsl(258_90%_66%/0.5)] animate-float">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Trophy className="w-3.5 h-3.5 text-primary-glow" />
              <span className="tracking-widest font-semibold">QUIZ</span>
            </div>
            <p className="text-sm font-semibold mb-3">
              What does <code className="text-accent bg-secondary/60 px-1.5 py-0.5 rounded text-xs">map()</code> return?
            </p>
            <div className="space-y-1.5">
              {[
                { t: "A new array", ok: true },
                { t: "The same array", ok: false },
                { t: "undefined", ok: false },
              ].map((o) => (
                <div key={o.t} className={`text-xs px-3 py-2 rounded-lg border ${o.ok ? "border-accent/50 bg-accent/10 text-accent" : "border-border bg-secondary/40 text-muted-foreground"} flex items-center justify-between`}>
                  <span>{o.t}</span>
                  {o.ok && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Question 4 / 10</span>
              <span className="text-primary-glow font-semibold">+50 XP</span>
            </div>
          </div>

          {/* Chatbot card */}
          <div className="absolute top-[220px] sm:top-[230px] left-0 sm:-left-4 w-[280px] sm:w-[320px] glass-card rounded-2xl p-4 shadow-[0_20px_50px_-20px_hsl(199_95%_60%/0.4)] animate-float" style={{ animationDelay: "1.2s" }}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <MessageCircle className="w-3.5 h-3.5 text-accent" />
              <span className="tracking-widest font-semibold">CHATBOT</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-gradient-primary text-white text-xs px-3 py-2 rounded-2xl rounded-br-md max-w-[80%]">
                  Explain recursion like I'm 10
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="glass rounded-2xl rounded-bl-md px-3 py-2 text-xs text-foreground/90 max-w-[80%]">
                  Imagine Russian dolls — each one opens to reveal a smaller copy of itself…
                </div>
              </div>
            </div>
          </div>

          {/* Profile card */}
          <div className="absolute bottom-0 right-0 w-[260px] sm:w-[280px] bg-gradient-primary rounded-2xl p-4 shadow-[0_25px_60px_-20px_hsl(258_90%_66%/0.7)] animate-float" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center gap-2 text-xs text-white/80 mb-3">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="tracking-widest font-semibold">PROFILE</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold">N</div>
              <div>
                <p className="text-white font-semibold text-sm">Nagesh</p>
                <p className="text-white/70 text-[11px]">Intermediate · 7-day streak 🔥</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { l: "XP", v: "2,340" },
                { l: "Topics", v: "12" },
                { l: "Quizzes", v: "38" },
              ].map((s) => (
                <div key={s.l} className="bg-white/15 backdrop-blur rounded-lg py-2">
                  <p className="text-white font-bold text-sm">{s.v}</p>
                  <p className="text-white/70 text-[10px]">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature row */}
      <section className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <Brain className="w-5 h-5 text-primary-glow" />, title: "Adaptive quizzes", body: "Difficulty scales with you. Get it right, level up. Get stuck, slow down." },
            { icon: <Zap className="w-5 h-5 text-accent" />, title: "Memory-aware chatbot", body: "Remembers weak topics, last lesson, and every mistake — so explanations actually land." },
            { icon: <Target className="w-5 h-5 text-primary-glow" />, title: "Real progress", body: "XP, streaks, and per-topic mastery. Your profile is the receipt for your effort." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-secondary/60 flex items-center justify-center mb-3">{f.icon}</div>
              <h3 className="font-display font-bold text-base mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-5 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5 text-primary-glow" />
            <span>Lumina · AI tutor that adapts to you</span>
          </div>
          <p className="text-muted-foreground text-lg">
            Created by <span className="font-semibold text-foreground/90">Nagesh</span>
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
