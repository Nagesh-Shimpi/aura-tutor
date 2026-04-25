import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Plus, Search, MessageSquare, Trash2, Send, GraduationCap, Code2, Menu, Loader2, X, User, BookOpen, Brain, BarChart3, LogOut, Flame, Zap, PlayCircle, ArrowRight, ArrowLeft, Trophy, History, Leaf, Flower2, Sun, Lightbulb, FileText, HelpCircle, Wand2, Home, Languages, Calculator, Atom } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/hooks/useStudent";
import { supabase } from "@/integrations/supabase/client";
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
const THEME_KEY = "lumina_nature_theme_v1";

type NatureTheme = "leafy" | "blossom" | "cream";
const THEMES: { id: NatureTheme; label: string; icon: any; chip: string; ring: string }[] = [
  { id: "leafy",   label: "Leafy",   icon: Leaf,    chip: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-400" },
  { id: "blossom", label: "Blossom", icon: Flower2, chip: "bg-pink-100 text-pink-700",       ring: "ring-pink-400" },
  { id: "cream",   label: "Cream",   icon: Sun,     chip: "bg-amber-100 text-amber-700",     ring: "ring-amber-400" },
];

const QUICK_ACTIONS: { label: string; prompt: string; icon: any }[] = [
  { label: "Explain like I'm 5", prompt: "Explain like I'm 5, with a vivid analogy: ", icon: Lightbulb },
  { label: "Quiz me (5 Qs)",     prompt: "Give me a 5-question quiz with answers hidden until I respond: ", icon: HelpCircle },
  { label: "Summarize",          prompt: "Summarize the key ideas in bullet points: ", icon: FileText },
  { label: "Improve & refactor", prompt: "Improve and refactor this, explaining each change: ", icon: Wand2 },
];

const ONE_TAP_SUGGESTIONS: { label: string; prompt: string; icon: any; tone: string }[] = [
  { label: "Explain photosynthesis",  prompt: "Explain photosynthesis step by step with an analogy",       icon: Leaf,       tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { label: "Translate to Spanish",    prompt: "Translate this to Spanish and explain the grammar: ",      icon: Languages,  tone: "bg-sky-100 text-sky-700 border-sky-200" },
  { label: "Solve quadratic",         prompt: "Solve x^2 - 5x + 6 = 0 step by step",                       icon: Calculator, tone: "bg-amber-100 text-amber-700 border-amber-200" },
  { label: "Explain atoms",           prompt: "Explain what atoms are like I'm 12, with an analogy",      icon: Atom,       tone: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
];

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

type Panel = null | "account" | "topics" | "quiz" | "progress" | "tutor";

const Lumina = () => {
  const { user, profile: authProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { profile: student, dismiss: dismissRec, refresh: refreshStudent } = useStudent();
  const { setSelectedTopicId, refreshKey } = useAppState();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [panel, setPanel] = useState<Panel>(null);
  const [theme, setTheme] = useState<NatureTheme>(() => {
    if (typeof window === "undefined") return "blossom";
    const saved = localStorage.getItem(THEME_KEY) as NatureTheme | null;
    return saved && THEMES.some(t => t.id === saved) ? saved : "blossom";
  });
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);
  const themeClass = `nature-theme theme-${theme}`;
  const [recentAttempts, setRecentAttempts] = useState<Array<{ id: string; score: number; total: number; xp_earned: number; created_at: string; topic: { title: string; icon: string } | null }>>([]);
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

  // Live quiz results
  useEffect(() => {
    if (!user) { setRecentAttempts([]); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("id, score, total, xp_earned, created_at, topic_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data || cancelled) return;
      const topicIds = Array.from(new Set(data.map((d) => d.topic_id))).filter(Boolean);
      const { data: topics } = await supabase
        .from("topics")
        .select("id, title, icon")
        .in("id", topicIds.length ? topicIds : ["00000000-0000-0000-0000-000000000000"]);
      const map = new Map((topics || []).map((t: any) => [t.id, { title: t.title, icon: t.icon }]));
      if (cancelled) return;
      setRecentAttempts(
        data.map((d: any) => ({
          id: d.id,
          score: d.score,
          total: d.total,
          xp_earned: d.xp_earned,
          created_at: d.created_at,
          topic: map.get(d.topic_id) || null,
        }))
      );
    })();
    // realtime updates
    const channel = supabase
      .channel(`quiz_attempts_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quiz_attempts", filter: `user_id=eq.${user.id}` },
        () => {
          // refetch on new attempt
          supabase
            .from("quiz_attempts")
            .select("id, score, total, xp_earned, created_at, topic_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5)
            .then(async ({ data }) => {
              if (!data) return;
              const topicIds = Array.from(new Set(data.map((d) => d.topic_id))).filter(Boolean);
              const { data: topics } = await supabase
                .from("topics")
                .select("id, title, icon")
                .in("id", topicIds.length ? topicIds : ["00000000-0000-0000-0000-000000000000"]);
              const map = new Map((topics || []).map((t: any) => [t.id, { title: t.title, icon: t.icon }]));
              setRecentAttempts(
                data.map((d: any) => ({
                  id: d.id,
                  score: d.score,
                  total: d.total,
                  xp_earned: d.xp_earned,
                  created_at: d.created_at,
                  topic: map.get(d.topic_id) || null,
                }))
              );
            });
        }
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user, refreshKey]);

  // Quick actions
  const topRec = student?.recommendations?.[0];
  const lastTopicId = student?.memory?.last_topic_id || topRec?.topic_id || null;

  const quickActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; sub: string; icon: any; onClick: () => void; accent: string }> = [];
    if (topRec) {
      actions.push({
        key: "next",
        label: "Next topic",
        sub: topRec.message.slice(0, 38) + (topRec.message.length > 38 ? "…" : ""),
        icon: ArrowRight,
        accent: "from-primary to-primary-glow",
        onClick: () => {
          if (topRec.topic_id) setSelectedTopicId(topRec.topic_id);
          setPanel(topRec.kind === "retry_mistakes" || topRec.kind === "level_up" || topRec.kind === "revise" ? "quiz" : "topics");
          setSidebarOpen(false);
        },
      });
    }
    actions.push({
      key: "quiz",
      label: "Start quiz",
      sub: lastTopicId ? "Continue your last topic" : "Pick a topic to begin",
      icon: PlayCircle,
      accent: "from-accent to-primary-glow",
      onClick: () => {
        if (lastTopicId) setSelectedTopicId(lastTopicId);
        setPanel("quiz");
        setSidebarOpen(false);
      },
    });
    if (recentAttempts[0]) {
      const last = recentAttempts[0];
      actions.push({
        key: "resume",
        label: "Resume session",
        sub: last.topic ? `${last.topic.icon} ${last.topic.title}` : "Last activity",
        icon: History,
        accent: "from-primary-glow to-accent",
        onClick: () => {
          setPanel("progress");
          setSidebarOpen(false);
        },
      });
    }
    return actions;
  }, [topRec, lastTopicId, recentAttempts, setSelectedTopicId]);

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
            className="w-full rounded-2xl bg-gradient-primary text-white font-semibold px-3.5 py-2.5 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_10px_30px_-10px_hsl(258_90%_66%/0.6)] text-base bg-destructive border-muted-foreground"
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

        {/* Features */}
        <div className="px-3 mt-3">
          <p className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5">
            Learn
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <FeatureBtn icon={BookOpen} label="Topics" onClick={() => { setPanel("topics"); setSidebarOpen(false); }} />
            <FeatureBtn icon={Brain} label="Quiz" onClick={() => { setPanel("quiz"); setSidebarOpen(false); }} />
            <FeatureBtn icon={BarChart3} label="Progress" onClick={() => { setPanel("progress"); setSidebarOpen(false); }} />
            <FeatureBtn icon={Sparkles} label="AI Coach" onClick={() => { setPanel("tutor"); setSidebarOpen(false); }} />
          </div>
        </div>

        {/* Quick actions */}
        {user && quickActions.length > 0 && (
          <div className="px-3 mt-3">
            <p className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-accent" /> Quick actions
            </p>
            <div className="space-y-1.5">
              {quickActions.map((a) => (
                <button
                  key={a.key}
                  onClick={a.onClick}
                  className="w-full glass-card rounded-xl px-2.5 py-2 flex items-center gap-2 hover:scale-[1.02] transition-transform text-left"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${a.accent} flex items-center justify-center shrink-0`}>
                    <a.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold leading-tight">{a.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{a.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live quiz results */}
        {user && recentAttempts.length > 0 && (
          <div className="px-3 mt-3">
            <p className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1.5 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-orange-400" /> Live results
              <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-emerald-400 font-medium normal-case tracking-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
              </span>
            </p>
            <div className="space-y-1">
              {recentAttempts.slice(0, 3).map((a) => {
                const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                const tone = pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-primary-glow" : "text-orange-400";
                return (
                  <div key={a.id} className="glass rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                    <span className="text-sm shrink-0">{a.topic?.icon || "📘"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{a.topic?.title || "Quiz"}</p>
                      <p className="text-[9px] text-muted-foreground">+{a.xp_earned} XP</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[11px] font-bold ${tone}`}>{a.score}/{a.total}</p>
                      <p className="text-[9px] text-muted-foreground">{pct}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

          {/* Account */}
          <div className="mt-3 pt-3 border-t border-border/50">
            {user ? (
              <div className="glass rounded-2xl p-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{authProfile?.display_name || user.email?.split("@")[0]}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>{authProfile?.xp ?? 0} XP</span>
                    <Flame className="w-2.5 h-2.5 text-orange-400" />
                    <span>{authProfile?.streak ?? 0}</span>
                  </p>
                </div>
                <button
                  onClick={async () => { await signOut(); toast.success("Signed out"); }}
                  className="w-7 h-7 rounded-lg hover:bg-secondary/60 flex items-center justify-center"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setPanel("account"); setSidebarOpen(false); }}
                className="w-full glass rounded-2xl p-2.5 flex items-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold">Sign in</p>
                  <p className="text-[10px] text-muted-foreground">Track XP, streaks & progress</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 flex flex-col min-w-0 relative text-slate-900 overflow-hidden nt-page-bg ${themeClass}`}>
        {/* Nature-inspired themable backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="nt-blob-1 absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl animate-blob" />
          <div className="nt-blob-2 absolute bottom-0 -left-10 w-96 h-96 rounded-full blur-3xl animate-blob" style={{ animationDelay: "5s" }} />
          <div className="nt-blob-3 absolute top-1/2 left-1/3 w-72 h-72 rounded-full blur-3xl animate-blob" style={{ animationDelay: "8s" }} />
          <div className="nt-blob-4 absolute top-8 right-0 w-80 h-80 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
          <div className="nt-blob-5 absolute bottom-10 right-10 w-72 h-72 rounded-full blur-3xl animate-blob" style={{ animationDelay: "6.5s" }} />
          <div className="nt-blob-6 absolute top-1/3 right-1/4 w-56 h-56 rounded-full blur-3xl animate-blob" style={{ animationDelay: "1.5s" }} />
          <div className="nt-blob-7 absolute bottom-1/3 left-1/2 w-64 h-64 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
          {/* subtle organic dot texture */}
          <div
            className="absolute inset-0 opacity-[0.07] mix-blend-multiply"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #16a34a 0.6px, transparent 1.6px), radial-gradient(circle at 70% 60%, #db2777 0.6px, transparent 1.6px)",
              backgroundSize: "28px 28px, 36px 36px",
            }}
          />
        </div>

        {/* Header */}
        <header className="relative z-10 px-4 md:px-6 py-3 flex items-center gap-3 border-b nt-surface backdrop-blur-md">
          {/* Back to home (mandatory) */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full nt-accent-gradient text-white text-xs font-semibold shadow-md hover:scale-[1.03] active:scale-95 transition-transform shrink-0"
            aria-label="Back to home"
            title="Back to home"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-10 h-10 rounded-2xl nt-surface border shadow-md active:scale-95 transition-transform flex items-center justify-center text-slate-700"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-display font-bold truncate nt-accent-text">{active.title}</h1>
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full nt-accent-gradient animate-pulse" />
              {active.mode === "code" ? "Code Mode · pair programmer" : "Tutor Mode · adaptive teaching"}
            </p>
          </div>
          {/* Theme switcher */}
          <div className="hidden sm:flex items-center gap-1 nt-surface border rounded-full p-1 shadow-sm">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={`${t.label} theme`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    active ? `${t.chip} ring-2 ${t.ring} shadow` : "text-slate-500 hover:text-slate-800"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </div>
          {/* Mobile theme cycler */}
          <button
            onClick={() => {
              const idx = THEMES.findIndex((t) => t.id === theme);
              setTheme(THEMES[(idx + 1) % THEMES.length].id);
            }}
            className="sm:hidden w-10 h-10 rounded-2xl nt-surface border shadow-md flex items-center justify-center"
            aria-label="Change theme"
          >
            {(() => { const T = THEMES.find(t => t.id === theme)!.icon; return <T className="w-4 h-4 text-slate-700" />; })()}
          </button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-hide">
          {/* Mobile panel shortcuts (chips) */}
          <div className="md:hidden sticky top-0 z-20 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide nt-surface backdrop-blur border-b">
            {[
              { icon: BookOpen,  label: "Topics",   onClick: () => setPanel("topics") },
              { icon: Brain,     label: "Quiz",     onClick: () => setPanel("quiz") },
              { icon: BarChart3, label: "Progress", onClick: () => setPanel("progress") },
              { icon: Sparkles,  label: "AI Coach", onClick: () => setPanel("tutor") },
              { icon: User,      label: user ? "Account" : "Sign in", onClick: () => setPanel("account") },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={s.onClick}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border nt-surface shadow-sm active:scale-95 transition-transform text-slate-700"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
          {active.messages.length === 0 ? (
            <HomeHero mode={active.mode} onPick={(s) => send(s)} userName={authProfile?.display_name || user?.email?.split("@")[0]} />
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 chat-light">
              <div className="space-y-5">
                {active.messages.map((m, i) => (
                  <MessageBubble key={i} msg={m} />
                ))}
                {thinking && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full nt-accent-gradient flex items-center justify-center shrink-0 shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 nt-surface border backdrop-blur shadow-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs text-slate-500">Thinking…</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="relative z-10 px-4 md:px-6 pb-5 pt-2">
          <div className="max-w-3xl mx-auto">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-1.5 mb-2 px-1">
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.label}
                    onClick={() => setInput((prev) => (prev ? `${qa.prompt}${prev}` : qa.prompt))}
                    className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold nt-surface border shadow-sm hover:scale-105 active:scale-95 transition-transform text-slate-700"
                    title={qa.prompt}
                  >
                    <Icon className="w-3 h-3 group-hover:rotate-6 transition-transform" />
                    {qa.label}
                  </button>
                );
              })}
            </div>
            {/* One-tap suggestions (only when input empty + active chat has messages) */}
            {!input && active.messages.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 px-1">
                {ONE_TAP_SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => send(s.prompt)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shadow-sm hover:scale-105 active:scale-95 transition-transform ${s.tone}`}
                    >
                      <Icon className="w-3 h-3" />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="rounded-3xl p-2 flex items-end gap-1.5 nt-surface backdrop-blur-xl border shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]">
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
                className="flex-1 bg-transparent outline-none text-sm md:text-base px-3 py-2.5 text-slate-900 placeholder:text-slate-400 min-w-0 resize-none max-h-40"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-2xl nt-accent-gradient text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 shrink-0 shadow-lg"
                aria-label="Send"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Lumina can make mistakes — verify important information.
            </p>
          </div>
        </div>

        {/* Mobile bottom nav — quick access to features */}
        <nav className="md:hidden relative z-10 flex items-center justify-around py-1.5 nt-surface border-t backdrop-blur">
          {[
            { icon: BookOpen,  label: "Topics",   onClick: () => setPanel("topics") },
            { icon: Brain,     label: "Quiz",     onClick: () => setPanel("quiz") },
            { icon: BarChart3, label: "Progress", onClick: () => setPanel("progress") },
            { icon: Sparkles,  label: "Coach",    onClick: () => setPanel("tutor") },
          ].map((b) => {
            const Icon = b.icon;
            return (
              <button
                key={b.label}
                onClick={b.onClick}
                className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl active:scale-95 transition-transform text-slate-600"
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-semibold">{b.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* Feature Panels (slide-over) */}
      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent
          side="right"
          className={`w-full sm:max-w-md p-0 overflow-hidden border-l [&>button]:hidden bg-white ${themeClass}`}
        >
          <div className="h-full flex flex-col relative overflow-hidden nt-page-bg text-slate-900">
            {/* Floating color blobs (matches home hero) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="nt-blob-1 absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl animate-blob" />
              <div className="nt-blob-2 absolute top-10 right-0 w-80 h-80 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
              <div className="nt-blob-3 absolute bottom-0 left-1/3 w-96 h-96 rounded-full blur-3xl animate-blob" style={{ animationDelay: "6s" }} />
              <div className="nt-blob-4 absolute bottom-10 right-10 w-64 h-64 rounded-full blur-3xl animate-blob" style={{ animationDelay: "9s" }} />
              <div className="nt-blob-5 absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4.5s" }} />
            </div>

            {/* Sticky back-to-home bar */}
            <div className="relative z-20 px-3 py-2.5 flex items-center gap-2 nt-surface backdrop-blur-md border-b">
              <button
                onClick={() => setPanel(null)}
                className="group flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full nt-accent-gradient text-white text-xs font-semibold shadow-md hover:scale-[1.03] transition-transform"
                aria-label="Back to home"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to home
              </button>
              <span className="ml-auto text-[10px] uppercase tracking-widest font-bold text-slate-500">
                {panel === "account" ? "Sign in" :
                  panel === "topics" ? "Topics" :
                  panel === "quiz" ? "Quiz" :
                  panel === "progress" ? "Progress" :
                  panel === "tutor" ? "AI Coach" : ""}
              </span>
              {/* Theme switcher inside panels */}
              <div className="flex items-center gap-0.5 nt-surface border rounded-full p-0.5">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        isActive ? `${t.chip} ring-2 ${t.ring}` : "text-slate-400 hover:text-slate-700"
                      }`}
                      aria-label={`${t.label} theme`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel content (themed wrapper) */}
            <div className="relative z-10 flex-1 overflow-hidden flex flex-col panel-themed">
              {panel === "account" && <LoginScreen />}
              {panel === "topics" && <TopicScreen />}
              {panel === "quiz" && <QuizScreen />}
              {panel === "progress" && <ProgressScreen />}
              {panel === "tutor" && (
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500">Personalised for you</p>
                  <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 bg-clip-text text-transparent">AI Coach</h2>
                </div>
                {!user ? (
                  <div className="rounded-2xl p-4 text-center bg-white/80 backdrop-blur border border-pink-100 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">Sign in to unlock AI Coach</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Personalised recommendations, weak-area tracking and adaptive difficulty.
                    </p>
                    <button
                      onClick={() => setPanel("account")}
                      className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white text-xs font-semibold shadow"
                    >
                      Sign in
                    </button>
                  </div>
                ) : (
                  <>
                    <TutorBanner
                      profile={student}
                      onAction={(rec) => {
                        if (rec.topic_id) setSelectedTopicId(rec.topic_id);
                        if (rec.kind === "retry_mistakes" || rec.kind === "level_up" || rec.kind === "revise") {
                          setPanel("quiz");
                        } else {
                          setPanel("topics");
                        }
                      }}
                      onDismiss={dismissRec}
                    />
                    <WeakTopicsStrip
                      profile={student}
                      onPickTopic={(id) => { setSelectedTopicId(id); setPanel("quiz"); }}
                      onRetryMistakes={() => setPanel("quiz")}
                    />
                    <button
                      onClick={() => refreshStudent()}
                      className="w-full rounded-2xl py-2.5 text-xs font-semibold bg-white/80 backdrop-blur border border-pink-100 shadow-sm hover:bg-white text-slate-700"
                    >
                      Refresh recommendations
                    </button>
                  </>
                )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const FeatureBtn = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="glass rounded-xl px-2 py-2 flex items-center gap-1.5 text-xs hover:bg-secondary/60 transition-colors"
  >
    <Icon className="w-3.5 h-3.5 text-primary-glow" />
    <span className="font-medium">{label}</span>
  </button>
);

const HomeHero = ({ mode, onPick, userName }: { mode: Mode; onPick: (s: string) => void; userName?: string }) => {
  const accents = [
    { bg: "from-violet-500 via-fuchsia-500 to-pink-500", icon: "✨", ring: "hover:ring-violet-300", glow: "group-hover:shadow-violet-300/60" },
    { bg: "from-sky-500 via-cyan-400 to-teal-400", icon: "🧠", ring: "hover:ring-sky-300", glow: "group-hover:shadow-sky-300/60" },
    { bg: "from-amber-400 via-orange-500 to-rose-500", icon: "🚀", ring: "hover:ring-amber-300", glow: "group-hover:shadow-amber-300/60" },
    { bg: "from-emerald-400 via-lime-400 to-yellow-400", icon: "💡", ring: "hover:ring-emerald-300", glow: "group-hover:shadow-emerald-300/60" },
  ];
  return (
    <div className="relative min-h-full bg-white text-slate-900 overflow-hidden">
      {/* Interactive color blobs — vibrant & layered */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-violet-400/70 blur-3xl animate-blob" />
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-sky-400/60 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-fuchsia-300/60 blur-3xl animate-blob" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-amber-300/70 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-emerald-300/70 blur-3xl animate-blob" style={{ animationDelay: "9s" }} />
        <div className="absolute top-1/2 -right-10 w-60 h-60 rounded-full bg-rose-300/60 blur-3xl animate-blob" style={{ animationDelay: "4.5s" }} />
      </div>

      <div className="relative max-w-3xl mx-auto w-full px-4 md:px-8 py-10 md:py-16">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-slate-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              {mode === "code" ? "Code mode" : "Tutor mode"}
            </span>
          </div>
          <h2 className="mt-5 text-4xl md:text-5xl font-display font-bold leading-[1.05] text-slate-900">
            {userName ? `Hi ${userName}, ` : "Hello, "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-clip-text text-transparent">
              {mode === "code" ? "let's ship something" : "ready to learn?"}
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 mt-3 max-w-md mx-auto">
            {mode === "code"
              ? "Ask for a snippet, a fix, or a refactor — clean, formatted code in seconds."
              : "Pick a topic, ask a doubt, or jump into a quick quiz. I adapt to your pace."}
          </p>
        </div>

        {/* Interactive suggestion cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTIONS[mode].map((s, i) => {
            const a = accents[i % accents.length];
            return (
              <button
                key={s}
                onClick={() => onPick(s)}
                className={`group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur border border-slate-200 p-4 text-left shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.015] hover:ring-2 ${a.ring} transition-all duration-300 ${a.glow}`}
              >
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${a.bg} opacity-25 group-hover:opacity-60 group-hover:scale-125 transition-all duration-500 blur-2xl`} />
                <div className={`absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-tr ${a.bg} opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl`} />
                <div className="relative flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.bg} flex items-center justify-center text-lg shadow-lg shrink-0 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{s}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 group-hover:text-slate-700 transition-colors">
                      Try this <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Color chips row */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {[
            { label: "Step-by-step", c: "bg-violet-100 text-violet-700 border-violet-200" },
            { label: "Adaptive", c: "bg-sky-100 text-sky-700 border-sky-200" },
            { label: "Quizzes", c: "bg-amber-100 text-amber-700 border-amber-200" },
            { label: "Doubt detection", c: "bg-emerald-100 text-emerald-700 border-emerald-200" },
            { label: "Memory", c: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
          ].map((chip) => (
            <span key={chip.label} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${chip.c}`}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ msg }: { msg: Msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? "bg-gradient-to-br from-sky-400 to-cyan-500 text-white"
            : "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-fuchsia-300/50"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-white" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white rounded-br-md shadow-lg shadow-fuchsia-300/40 whitespace-pre-wrap"
            : "bg-white/85 backdrop-blur-md border border-pink-100 rounded-bl-md shadow-sm text-slate-800"
        }`}
      >
        {isUser ? (
          msg.content
        ) : msg.content ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        ) : (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
        )}
      </div>
    </div>
  );
};

export default Lumina;