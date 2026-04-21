const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, studentContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const baseSystem =
      "You are an enthusiastic, friendly AI tutor for students. Explain concepts clearly with short paragraphs, simple examples, and occasional emojis. Keep responses concise (under 120 words) unless deeper explanation is needed. Adapt your explanations to the student's level: simpler analogies for beginners, more depth for advanced learners. When the student struggles with a topic, proactively offer a quick recap before answering.";

    let contextBlock = "";
    if (studentContext) {
      const { displayName, difficulty, weakTopics, lastTopic, totalQuizzes, recentMistakes } = studentContext;
      contextBlock = `\n\n[STUDENT CONTEXT — use this to personalize, do not quote it back verbatim]\n` +
        `Name: ${displayName || "Learner"}\n` +
        `Current level: ${difficulty || "beginner"}\n` +
        `Total quizzes taken: ${totalQuizzes ?? 0}\n` +
        (lastTopic ? `Last topic studied: ${lastTopic}\n` : "") +
        (weakTopics?.length ? `Weak topics needing reinforcement: ${weakTopics.join(", ")}\n` : "") +
        (recentMistakes?.length ? `Recent misconceptions: ${recentMistakes.slice(0, 3).join(" | ")}\n` : "");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: baseSystem + contextBlock },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-tutor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
