import { Mail, Lock, Apple } from "lucide-react";

export const LoginScreen = () => (
  <div className="relative flex-1 flex flex-col p-6 pt-14 overflow-hidden">
    <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/30 rounded-full blur-3xl" />
    <div className="relative z-10 flex flex-col gap-6 mt-6">
      <div>
        <h2 className="text-3xl font-display font-bold">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to continue learning</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground/80">nagesh@lumina.ai</span>
        </div>
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground tracking-widest">••••••••</span>
        </div>
        <p className="text-xs text-primary-glow text-right">Forgot password?</p>
      </div>

      <button className="w-full py-3.5 rounded-2xl bg-gradient-primary text-white font-semibold text-sm shadow-[0_10px_30px_-8px_hsl(258_90%_66%/0.6)] hover:scale-[1.02] transition-transform">
        Sign In
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="glass-card rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium">
          <span className="text-base">G</span> Google
        </button>
        <button className="glass-card rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-medium">
          <Apple className="w-4 h-4" /> Apple
        </button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-auto">
        New here? <span className="text-primary-glow font-semibold">Create account</span>
      </p>
    </div>
  </div>
);
