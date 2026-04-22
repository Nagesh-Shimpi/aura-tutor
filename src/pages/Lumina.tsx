import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Plus, Search, MessageSquare, Trash2, Send, GraduationCap, Code2, Menu, Loader2, X, User, BookOpen, Brain, BarChart3, LogOut, Flame } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/hooks/useStudent";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { TopicScreen } from "@/components/screens/TopicScreen";
import { QuizScreen } from "@/components/screens/QuizScreen";
import { ProgressScreen } from "@/components/screens/ProgressScreen";
import { TutorBanner } from "@/components/tutor/TutorBanner";
import { WeakTopicsStrip } from "@/components/tutor/WeakTopicsStrip";
import { useAppState } from "@/hooks/useAppState";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const STORAGE_KEY = "lumina_chats_v1";
const ACTIVE_KEY = "lumina_active_v1";

type Mode = "tutor" | "code";
type Msg = { role: "user" | "assistant"; content: string };
type Chat = { id: string; title: string; mode: Mode; messages: Msg[]; updatedAt: number };

const newId = () => Math.random().toString(36).slice(2, 10);
const newChat = (mode: Mode): Chat => ({
  id: newId(),
  title: "New chat",
  mode,
  messages: [],
  updatedAt: Date.now(),
});

const SUGGESTIONS: Record<Mode, string[]> = {
  tutor: [
    "Explain recursion step by step",
    "Quiz me on photosynthesis",
    "I don't understand pointers — eli5",
    "Teach me Big-O notation",
  ],
  code: [
    "Debounce hook in TypeScript",
    "SQL: top 5 customers by revenue",
    "Python script to dedupe a CSV",
    "React: animated accordion with Framer",
  ],
};

const Lumina = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: Chat[] = raw ? JSON.parse(raw) : [];
      const active = localStorage.getItem(ACTIVE_KEY) || "";
      if (parsed.length === 0) {
        const c = newChat("tutor");
        setChats([c]);
        setActiveId(c.id);
      } else {
        setChats(parsed);
        setActiveId(parsed.some((c) => c.id === active) ? active : parsed[0].id);
      }
    } catch {
      const c = newChat("tutor");
      setChats([c]);
      setActiveId(c.id);
    }
  }, []);

  // Persist
  useEffect(() => {
    if (chats.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const active = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages, loading, thinking]);

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [chats, search]);

  const updateChat = (id: string, patch: Partial<Chat> | ((c: Chat) => Chat)) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = typeof patch === "function" ? patch(c) : { ...c, ...patch };
        return { ...next, updatedAt: Date.now() };
      })
    );
  };

  const handleNewChat = () => {
    const c = newChat(active?.mode || "tutor");
    setChats((p) => [c, ...p]);
    setActiveId(c.id);
    setSidebarOpen(false);
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        if (next.length) setActiveId(next[0].id);
        else {
          const c = newChat("tutor");
          setActiveId(c.id);
          return [c];
        }
      }
      return next;
    });
  };

  const setMode = (m: Mode) => {
    if (!active) return;
    updateChat(active.id, { mode: m });
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || !active) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const isFirst = active.messages.length === 0;
    const nextMessages = [...active.messages, userMsg];
    updateChat(active.id, {
      messages: nextMessages,
      title: isFirst ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : active.title,
    });

    setLoading(true);
    setThinking(true);

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/chat-tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, mode: active.mode }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit hit. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Something went wrong.");
        setLoading(false);
        setThinking(false);
        return;
      }

      // Append empty assistant message we'll fill via streaming
      updateChat(active.id, (c) => ({
        ...c,
        messages: [...c.messages, { role: "assistant", content: "" }],
      }));

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistant = "";
      let done = false;
      let firstToken = true;

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
              if (firstToken) { setThinking(false); firstToken = false; }
              assistant += c;
              updateChat(active.id, (chat) => ({
                ...chat,
                messages: chat.messages.map((m, i) =>
                  i === chat.messages.length - 1 ? { ...m, content: assistant } : m
                ),
              }));
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  if (!active) return null;

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 shrink-0 flex flex-col glass border-r border-border/50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_8px_24px_-8px_hsl(258_90%_66%/0.6)]">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-bold text-base leading-tight">Lumina</p>
              <p className="text-[10px] text-muted-foreground">AI Tutor</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 rounded-lg glass flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3">
          <button
            onClick={handleNewChat}
            className="w-full rounded-2xl bg-gradient-primary text-white text-sm font-semibold px-3.5 py-2.5 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_10px_30px_-10px_hsl(258_90%_66%/0.6)]"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 mt-3">
          <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="bg-transparent outline-none text-xs flex-1 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pt-3 pb-2 space-y-1">
          <p className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
            Recent
          </p>
          {filteredChats.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground">No chats found.</p>
          )}
          {filteredChats.map((c) => (
            <button
              key={c.id}
              onClick={() => { setActiveId(c.id); setSidebarOpen(false); }}
              className={`group w-full text-left rounded-xl px-2.5 py-2 flex items-center gap-2 transition-colors ${
                c.id === activeId ? "bg-secondary/80 text-foreground" : "hover:bg-secondary/40 text-muted-foreground"
              }`}
            >
              {c.mode === "code" ? (
                <Code2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="flex-1 truncate text-xs">{c.title}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); handleDeleteChat(c.id); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleDeleteChat(c.id); } }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 cursor-pointer"
                aria-label="Delete chat"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </span>
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="p-3 border-t border-border/50">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2 px-1">
            Mode
          </p>
          <div className="glass rounded-2xl p-1 grid grid-cols-2 gap-1">
            <button
              onClick={() => setMode("tutor")}
              className={`rounded-xl px-2 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                active.mode === "tutor"
                  ? "bg-gradient-primary text-white shadow-[0_6px_20px_-8px_hsl(258_90%_66%/0.8)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Tutor
            </button>
            <button
              onClick={() => setMode("code")}
              className={`rounded-xl px-2 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                active.mode === "code"
                  ? "bg-gradient-primary text-white shadow-[0_6px_20px_-8px_hsl(258_90%_66%/0.8)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Code
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/80 mt-2 px-1 leading-snug">
            {active.mode === "tutor"
              ? "Step-by-step teaching, quizzes & doubt detection."
              : "Clean, formatted code answers in fenced blocks."}
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="px-4 md:px-6 py-3 flex items-center gap-3 border-b border-border/50 glass">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl glass flex items-center justify-center"
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-display font-bold truncate">{active.title}</h1>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${active.mode === "code" ? "bg-accent" : "bg-primary-glow"} animate-pulse`} />
              {active.mode === "code" ? "Code Mode · pair programmer" : "Tutor Mode · adaptive teaching"}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6">
            {active.messages.length === 0 ? (
              <div className="text-center pt-10 md:pt-20 animate-fade-in">
                <div className="w-16 h-16 rounded-3xl bg-gradient-primary mx-auto flex items-center justify-center shadow-[0_20px_60px_-20px_hsl(258_90%_66%/0.6)] mb-5">
                  <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold">
                  How can I help you{" "}
                  <span className="gradient-text">{active.mode === "code" ? "ship code" : "learn"}</span>?
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {active.mode === "code"
                    ? "Ask for a snippet, a fix, or a refactor."
                    : "Pick a topic, ask a doubt, or take a quick quiz."}
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                  {SUGGESTIONS[active.mode].map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="glass-card rounded-2xl px-4 py-3 text-left text-sm hover:scale-[1.02] transition-transform"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {active.messages.map((m, i) => (
                  <MessageBubble key={i} msg={m} />
                ))}
                {thinking && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-glow" />
                      <span className="text-xs text-muted-foreground">Thinking…</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="px-4 md:px-6 pb-5 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="glass-card rounded-3xl p-2 flex items-end gap-1.5 shadow-[0_20px_60px_-20px_hsl(258_90%_66%/0.4)]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={active.mode === "code" ? "Ask for code…" : "Ask Lumina anything…"}
                className="flex-1 bg-transparent outline-none text-sm md:text-base px-3 py-2.5 placeholder:text-muted-foreground min-w-0 resize-none max-h-40"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-2xl bg-gradient-primary text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 shrink-0"
                aria-label="Send"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
              Lumina can make mistakes — verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

const MessageBubble = ({ msg }: { msg: Msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "glass" : "bg-gradient-primary"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-primary text-white rounded-br-md shadow-md whitespace-pre-wrap"
            : "glass-card rounded-bl-md"
        }`}
      >
        {isUser ? (
          msg.content
        ) : msg.content ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        )}
      </div>
    </div>
  );
};

export default Lumina;