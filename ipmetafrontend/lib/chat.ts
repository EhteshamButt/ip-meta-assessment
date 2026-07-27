import { ApiError, getApiBaseUrl } from "./api";
import { ApiErrorBody } from "./types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatReplyBody {
  reply: string;
}

export async function sendChatMessage(history: ChatMessage[]): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
  } catch {
    throw new ApiError("Could not reach the AI guide. Is the backend running?", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? `The AI guide failed with status ${response.status}`);
    throw new ApiError(message, response.status);
  }

  const data = (await response.json()) as ChatReplyBody;
  return data.reply;
}
