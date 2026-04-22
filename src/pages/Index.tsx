import { PhoneFrame } from "@/components/PhoneFrame";
import { SplashScreen } from "@/components/screens/SplashScreen";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ChatScreen } from "@/components/screens/ChatScreen";
import { TopicScreen } from "@/components/screens/TopicScreen";
import { QuizScreen } from "@/components/screens/QuizScreen";
import { ProgressScreen } from "@/components/screens/ProgressScreen";
import { Sparkles, Brain, Repeat, Target, Database, Zap, Smartphone } from "lucide-react";

const screens = [
  { label: "Splash", node: <SplashScreen /> },
  { label: "Login", node: <LoginScreen /> },
  { label: "Home", node: <HomeScreen /> },
  { label: "AI Chat", node: <ChatScreen /> },
  { label: "Topic", node: <TopicScreen /> },
  { label: "Quiz", node: <QuizScreen /> },
  { label: "Progress", node: <ProgressScreen /> },
];

const Index = () => {
  return (
    <main className="min-h-screen w-full">
      {/* Hero */}
      <header className="relative px-6 pt-16 pb-10 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
          <span className="text-xs font-medium tracking-wide">AI-Powered Learning · 2026</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05]">
          Meet <span className="gradient-text">Lumina</span>
          <br />
          <span className="text-foreground/90">your virtual tutor.</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mt-5 max-w-xl mx-auto">
          A modern AI tutor app — clean, glass-morphic, and built to make learning feel effortless.
          The chat screen is wired to a real AI. Try it.
        </p>
      </header>

      {/* Phones grid */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-14">
          {screens.map((s, i) => (
            <PhoneFrame key={s.label} label={s.label} index={i}>
              {s.node}
            </PhoneFrame>
          ))}
        </div>
      </section>

      {/* How it works — for judges */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-4">
            <Brain className="w-3.5 h-3.5 text-primary-glow" />
            <span className="text-xs font-medium tracking-wide">How Lumina works</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
            Not a chatbot. <span className="gradient-text">An adaptive tutor.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl mx-auto">
            Lumina runs a continuous learning loop, remembers every student, and adapts its teaching in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Repeat className="w-5 h-5 text-primary-glow" />,
              title: "Learning Loop",
              body: "Topic → Explanation → Quiz → Feedback → Next. Every session pushes the student forward, never sideways.",
            },
            {
              icon: <Target className="w-5 h-5 text-primary-glow" />,
              title: "Adaptive Difficulty",
              body: "≥80% accuracy? Difficulty rises (beginner → intermediate → advanced). ≤40%? It scales back and queues a revision.",
            },
            {
              icon: <Database className="w-5 h-5 text-primary-glow" />,
              title: "Persistent Memory",
              body: "Per-topic mastery scores, weak areas, last activity, and every wrong answer are stored — and injected into the tutor's system prompt.",
            },
            {
              icon: <Zap className="w-5 h-5 text-primary-glow" />,
              title: "Proactive Agent",
              body: "Lumina greets returning students with the next best action: 'Revise Arrays', 'Retry mistakes', or 'Try a harder quiz'.",
            },
            {
              icon: <Brain className="w-5 h-5 text-primary-glow" />,
              title: "Doubt Detection",
              body: "When you say 'I don't get it' or 'huh?', Lumina switches to Explain-Like-a-Teacher mode with a fresh analogy.",
            },
            {
              icon: <Smartphone className="w-5 h-5 text-primary-glow" />,
              title: "Installable PWA",
              body: "Add Lumina to your home screen and it launches in standalone mode — feels like a native mobile app.",
            },
          ].map((c) => (
            <div key={c.title} className="glass-card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary/20 flex items-center justify-center mb-3">
                {c.icon}
              </div>
              <h3 className="font-display font-bold text-base mb-1.5">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-6 md:p-8 mt-8">
          <p className="text-[10px] uppercase tracking-widest text-primary-glow font-bold mb-2">Architecture</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-foreground font-semibold">Frontend:</span> React 18 + Vite + Tailwind, glass-morphic mobile-first UI.{" "}
            <span className="text-foreground font-semibold">Backend:</span> Lovable Cloud (Postgres + RLS) with edge functions{" "}
            <code className="text-primary-glow">tutor-memory</code>, <code className="text-primary-glow">tutor-adaptive</code>,{" "}
            <code className="text-primary-glow">tutor-proactive</code>, <code className="text-primary-glow">chat-tutor</code>,{" "}
            <code className="text-primary-glow">generate-quiz</code>.{" "}
            <span className="text-foreground font-semibold">AI:</span> Lovable AI Gateway (Gemini Flash) for streaming chat & quiz generation.{" "}
            <span className="text-foreground font-semibold">Adaptation:</span> a Postgres trigger on{" "}
            <code className="text-primary-glow">quiz_attempts</code> recomputes mastery and updates difficulty automatically — no client logic needed.
          </p>
        </div>
      </section>

      <footer className="text-center pb-10 text-xs text-muted-foreground">
        Designed with glassmorphism, gradients & love · Lumina UI Kit
      </footer>
    </main>
  );
};

export default Index;
