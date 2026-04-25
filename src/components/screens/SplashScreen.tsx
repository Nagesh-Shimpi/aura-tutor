import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const THEME_KEY = "lumina_nature_theme_v1";

export const SplashScreen = () => {
  const [theme, setTheme] = useState<"leafy" | "blossom" | "cream">("blossom");
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as any;
    if (saved === "leafy" || saved === "blossom" || saved === "cream") setTheme(saved);
  }, []);
  return (
    <div className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden nature-theme theme-${theme} nt-page-bg`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="nt-blob-1 absolute top-20 left-10 w-40 h-40 rounded-full blur-3xl animate-blob" />
        <div className="nt-blob-4 absolute bottom-32 right-10 w-48 h-48 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        <div className="nt-blob-7 absolute top-1/2 right-1/3 w-32 h-32 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-6 animate-scale-in">
        <div className="w-24 h-24 rounded-3xl nt-accent-gradient flex items-center justify-center shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] animate-float">
          <Sparkles className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold nt-accent-text">Lumina</h1>
          <p className="text-sm text-slate-600 mt-2 tracking-wide">Your AI Tutor, Reimagined</p>
        </div>
        <div className="absolute -bottom-32 flex gap-1.5">
          <span className="w-2 h-2 rounded-full nt-accent-gradient animate-typing" />
          <span className="w-2 h-2 rounded-full nt-accent-gradient animate-typing" style={{ animationDelay: "0.2s" }} />
          <span className="w-2 h-2 rounded-full nt-accent-gradient animate-typing" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
};
