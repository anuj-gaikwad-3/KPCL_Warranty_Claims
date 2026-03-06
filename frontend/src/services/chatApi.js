import { baseUrl } from "../config/api";

export async function sendMessage(message, userId = "admin") {
  const res = await fetch(`${baseUrl}/api/v1/chatbot/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, user_id: userId }),
  });
  if (!res.ok) throw new Error(`Chat API returned ${res.status}`);
  return res.json();
}
