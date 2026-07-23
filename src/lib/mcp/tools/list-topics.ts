import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_topics",
  title: "List learning topics",
  description: "List available Lumina learning topics, optionally filtered by a case-insensitive search string.",
  inputSchema: {
    search: z.string().trim().max(120).nullable().describe("Optional search term matched against topic title/category."),
    limit: z.number().int().min(1).max(50).nullable().describe("Max rows to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx).from("topics").select("id, title, category, description, difficulty").limit(limit ?? 20);
    if (search) q = q.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { topics: data ?? [] } };
  },
});