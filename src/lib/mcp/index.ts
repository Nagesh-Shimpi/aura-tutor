import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get-profile";
import listTopics from "./tools/list-topics";
import recentQuiz from "./tools/recent-quiz-attempts";
import recentChat from "./tools/recent-chat";
import saveNote from "./tools/save-note";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lumina-mcp",
  title: "Lumina AI Tutor",
  version: "0.1.0",
  instructions:
    "Tools for Lumina, an AI tutor app. Use these to read the signed-in learner's profile, topics, recent quiz attempts, and tutor chat history, and to append notes to their chat.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfile, listTopics, recentQuiz, recentChat, saveNote],
});