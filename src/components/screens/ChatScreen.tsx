import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const ChatScreen = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey Nagesh! 👋 I'm your AI tutor. What would you like to learn today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
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
      let buf = "";
      let assistant = "";
      let done = false;
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
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-display font-bold">AI Tutor</p>
          <p className="text-[10px] text-accent flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-accent rounded-full" /> Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={
              m.role === "user"
                ? "max-w-[78%] bg-gradient-primary text-white text-xs px-3.5 py-2.5 rounded-2xl rounded-br-md shadow-md"
                : "max-w-[82%] glass-card text-xs px-3.5 py-2.5 rounded-2xl rounded-bl-md"
            }>
              {m.content || <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
          </div>
        ))}
        {loading && messages[messages.length-1]?.role === "user" && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-card px-3.5 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-typing" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-typing" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-typing" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-5 pt-2">
        <div className="glass-card rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent outline-none text-xs placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white disabled:opacity-50 hover:scale-105 transition-transform"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
