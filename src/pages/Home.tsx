import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Send } from "lucide-react";

const SUGGESTIONS = [
  "Explain quantum entanglement simply",
  "Help me practice algebra",
  "Generate an image of the solar system",
  "Quiz me on world history",
];

const Home = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const startChat = () => {
    if (input.trim()) {
      sessionStorage.setItem("ai_tutor_initial_prompt", input.trim());
    }
    navigate("/app");
  };

  return (
    <main className="min-h-screen w-full flex flex-col">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(258_90%_66%/0.6)]">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg">AI Tutor</span>
        </div>
        <button
          onClick={() => navigate("/app")}
          className="glass rounded-full px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:scale-105 transition-transform"
        >
          Open App <ArrowRight className="w-3 h-3" />
        </button>
      </header>

      {/* Hero / Center */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-3xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium tracking-wide text-muted-foreground">Powered by Lumina · 2026</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-display font-bold leading-[1.05] mb-4">
          <span className="gradient-text">AI Tutor</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-2">
          Your Smart Learning Assistant
        </p>
        <p className="text-sm text-muted-foreground/80 max-w-lg mb-10">
          Ask anything. Learn anything. Voice, text, and images — all in one place.
        </p>

        {/* Centered chat input */}
        <div className="w-full max-w-2xl">
          <div className="glass-card rounded-3xl p-2 flex items-center gap-2 shadow-[0_20px_60px_-20px_hsl(258_90%_66%/0.4)]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startChat()}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent outline-none text-sm md:text-base px-4 py-3 placeholder:text-muted-foreground min-w-0"
            />
            <button
              onClick={startChat}
              className="h-11 px-5 rounded-2xl bg-gradient-primary text-white text-sm font-semibold flex items-center gap-2 hover:scale-[1.03] transition-transform shrink-0"
            >
              Start Chat <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="glass rounded-full px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:scale-105 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-6 pt-4 text-xs text-muted-foreground">
        Created by <span className="font-semibold text-foreground/90">Nagesh Shimpi</span>
      </footer>
    </main>
  );
};

export default Home;
