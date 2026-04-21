import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Send, Loader2, ImageIcon, Mic, MicOff, Volume2, Download, User } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const IMAGE_TRIGGERS = /\b(generate|create|draw|show|make|render)\b.*\b(image|picture|illustration|diagram|drawing|photo|pic)\b/i;

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string };

const SUGGESTIONS = [
  "Explain quantum entanglement simply",
  "Help me practice algebra",
  "Generate an image of the solar system",
  "Quiz me on world history",
];

const Home = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const speak = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_`#>]/g, ""));
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input not supported");
    if (listening) { recognitionRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false;
    r.onresult = (e: any) => setInput((p) => (p ? p + " " : "") + e.results[0][0].transcript);
    r.onerror = () => { setListening(false); toast.error("Voice error"); };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    setListening(true);
    r.start();
  };

  const generateImage = async (prompt: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "Image generation failed");
        return;
      }
      setMessages((p) => [...p, { role: "assistant", content: `Here's your image: ${prompt}`, imageUrl: data.imageUrl }]);
    } catch {
      toast.error("Network error");
    } finally { setLoading(false); }
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);

    if (imageMode || IMAGE_TRIGGERS.test(text)) {
      setImageMode(false);
      await generateImage(text);
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat-tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit hit. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Something went wrong.");
        setLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", assistant = "", done = false;
      setMessages((p) => [...p, { role: "assistant", content: "" }]);
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistant += c;
              setMessages((p) => p.map((m, i) => i === p.length - 1 ? { ...m, content: assistant } : m));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch {
      toast.error("Network error");
    } finally { setLoading(false); }
  };

  const hasChat = messages.length > 0;

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
