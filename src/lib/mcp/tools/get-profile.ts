import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_profile",
  title: "Get my Lumina profile",
  description: "Return the signed-in Lumina learner's profile: display name, XP, streak, current difficulty, and totals.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const [{ data: profile }, { data: memory }] = await Promise.all([
      client.from("profiles").select("display_name, xp, streak").eq("user_id", ctx.getUserId()).maybeSingle(),
      client.from("student_memory").select("current_difficulty, total_quizzes, total_correct, total_questions, last_activity_at").eq("user_id", ctx.getUserId()).maybeSingle(),
    ]);
    const out = { profile, memory };
    return { content: [{ type: "text", text: JSON.stringify(out) }], structuredContent: out };
  },
});