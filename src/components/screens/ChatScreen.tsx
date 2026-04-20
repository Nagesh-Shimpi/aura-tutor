import { ArrowLeft, Send, Sparkles, Loader2, Trash2, Mic, MicOff, Volume2, VolumeX, ImageIcon, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Msg = { role: "user" | "assistant"; content: string; imageUrl?: string };
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Detect image-generation intent in user text
const IMAGE_TRIGGERS = /\b(generate|create|draw|show|make|render)\b.*\b(image|picture|illustration|diagram|drawing|photo|pic)\b/i;

export const ChatScreen = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsOn, setTtsOn] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speakMessage = (text: string) => {
    if (!("speechSynthesis" in window)) return toast.error("Speech not supported");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_`#>]/g, ""));
    u.rate = 1; u.lang = "en-US";
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input not supported in this browser");
    if (listening) { recognitionRef.current?.stop(); return; }
    const r = new SR();
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + transcript);
    };
    r.onerror = () => { setListening(false); toast.error("Voice input error"); };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    setListening(true);
    r.start();
  };

  // Load history
  useEffect(() => {
    (async () => {
      if (!user) {
        setMessages([{ role: "assistant", content: "👋 Hey! I'm Lumina, your AI tutor. Sign in (Login phone) to save our conversation, or just start asking!" }]);
        return;
      }
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data && data.length) {
        setMessages(data as Msg[]);
      } else {
        setMessages([{ role: "assistant", content: `Hey ${profile?.display_name?.split(" ")[0] || "there"}! 👋 What would you like to learn today?` }]);
      }
      // Consume initial prompt from Home page (if any)
      const initial = sessionStorage.getItem("ai_tutor_initial_prompt");
      if (initial) {
        sessionStorage.removeItem("ai_tutor_initial_prompt");
        setInput(initial);
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const persist = async (m: Msg) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({ user_id: user.id, role: m.role, content: m.content });
  };

  const clearHistory = async () => {
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([{ role: "assistant", content: "Cleared! What's next? ✨" }]);
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
        if (resp.status === 429) toast.error("Rate limit hit.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error(data.error || "Image generation failed");
        return;
      }
      const msg: Msg = { role: "assistant", content: `Here's your image: ${prompt}`, imageUrl: data.imageUrl };
      setMessages((p) => [...p, msg]);
      if (user) await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: `[image] ${prompt}` });
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    persist(userMsg);

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
      if (assistant) {
        persist({ role: "assistant", content: assistant });
        if (ttsOn) speakMessage(assistant);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 pt-12 pb-3 flex items-center gap-2.5 border-b border-border/50">
        <div className="w-7 h-7 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="w-3.5 h-3.5" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-display font-bold">AI Tutor</p>
          <p className="text-[9px] text-accent flex items-center gap-1">
            <span className="w-1 h-1 bg-accent rounded-full" /> Online
          </p>
        </div>
        <button
          onClick={() => {
            setTtsOn((v) => { if (v) window.speechSynthesis?.cancel(); return !v; });
          }}
          className={`w-7 h-7 rounded-full glass flex items-center justify-center ${ttsOn ? "ring-1 ring-accent" : ""}`}
          title={ttsOn ? "Voice output ON" : "Voice output OFF"}
        >
          {ttsOn ? <Volume2 className="w-3 h-3 text-accent" /> : <VolumeX className="w-3 h-3 text-muted-foreground" />}
        </button>
        {user && (
          <button onClick={clearHistory} className="w-7 h-7 rounded-full glass flex items-center justify-center" title="Clear history">
            <Trash2 className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-2.5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className="flex flex-col gap-1.5 max-w-[82%]">
              <div className={
                m.role === "user"
                  ? "bg-gradient-primary text-white text-[11px] px-3 py-2 rounded-2xl rounded-br-md shadow-md whitespace-pre-wrap"
                  : "glass-card text-[11px] px-3 py-2 rounded-2xl rounded-bl-md whitespace-pre-wrap"
              }>
                {m.content || <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              {m.imageUrl && (
                <div className="space-y-1">
                  <img src={m.imageUrl} alt="Generated" className="rounded-xl border border-border/40 max-w-full" />
                  <a
                    href={m.imageUrl}
                    download={`ai-tutor-${Date.now()}.png`}
                    className="inline-flex items-center gap-1 text-[9px] text-muted-foreground hover:text-accent"
                  >
                    <Download className="w-2.5 h-2.5" /> Save image
                  </a>
                </div>
              )}
              {m.role === "assistant" && m.content && !m.imageUrl && (
                <button
                  onClick={() => speakMessage(m.content)}
                  className="self-start text-[9px] text-muted-foreground hover:text-accent flex items-center gap-1"
                  title="Listen"
                >
                  <Volume2 className="w-2.5 h-2.5" /> Play
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-card px-3 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-typing" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-typing" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-typing" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pb-4 pt-2">
        <div className="glass-card rounded-full pl-3.5 pr-1.5 py-1.5 flex items-center gap-2">
          <button
            onClick={() => setImageMode((v) => !v)}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${imageMode ? "bg-gradient-primary text-white" : "glass text-muted-foreground"}`}
            title="Generate image"
          >
            <ImageIcon className="w-3 h-3" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={imageMode ? "Describe an image..." : "Ask me anything..."}
            className="flex-1 bg-transparent outline-none text-[11px] placeholder:text-muted-foreground min-w-0"
          />
          <button
            onClick={startListening}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${listening ? "bg-destructive text-white animate-pulse" : "glass text-muted-foreground"}`}
            title={listening ? "Stop listening" : "Voice input"}
          >
            {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </button>
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white disabled:opacity-50 hover:scale-105 transition-transform shrink-0"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
