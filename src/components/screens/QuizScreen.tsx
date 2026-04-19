import { X, Flame, Check } from "lucide-react";

const options = [
  { letter: "A", text: "f'(x) = 2x", correct: false, selected: false },
  { letter: "B", text: "f'(x) = x²", correct: false, selected: false },
  { letter: "C", text: "f'(x) = 2x + 3", correct: true, selected: true },
  { letter: "D", text: "f'(x) = x + 3", correct: false, selected: false },
];

export const QuizScreen = () => (
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header */}
    <div className="px-5 pt-12 pb-4 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
        <X className="w-4 h-4" />
      </div>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full w-[60%] bg-gradient-primary rounded-full" />
      </div>
      <div className="flex items-center gap-1 glass rounded-full px-2.5 py-1">
        <Flame className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs font-bold">7</span>
      </div>
    </div>

    <div className="flex-1 px-5 overflow-y-auto scrollbar-hide pb-5">
      <p className="text-[10px] text-primary-glow font-bold uppercase tracking-widest mt-2">Question 3 of 5</p>
      <h3 className="text-xl font-display font-bold leading-tight mt-2">
        What is the derivative of <span className="gradient-text">f(x) = x² + 3x</span>?
      </h3>

      <div className="mt-6 space-y-2.5">
        {options.map((o) => (
          <div
            key={o.letter}
            className={`rounded-2xl p-3.5 flex items-center gap-3 transition-all ${
              o.selected
                ? "bg-gradient-primary shadow-[0_10px_30px_-10px_hsl(258_90%_66%/0.6)]"
                : "glass-card"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
              o.selected ? "bg-white/20 text-white" : "bg-secondary text-foreground"
            }`}>
              {o.letter}
            </div>
            <p className={`text-sm font-medium flex-1 ${o.selected ? "text-white" : ""}`}>{o.text}</p>
            {o.selected && <Check className="w-4 h-4 text-white" />}
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-primary text-white font-semibold text-sm shadow-[0_10px_30px_-8px_hsl(258_90%_66%/0.6)]">
        Check Answer
      </button>

      <div className="glass-card rounded-2xl p-3 mt-4 flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          💡
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Hint:</span> Use the power rule on each term separately.
        </p>
      </div>
    </div>
  </div>
);
