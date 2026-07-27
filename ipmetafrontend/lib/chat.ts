export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponseBody {
  reply: string;
}

export interface ChatErrorBody {
  error: string;
}

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_HISTORY_MESSAGES = 12;

export async function sendChatMessage(history: ChatMessage[]): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history }),
  });

  const data = (await response.json().catch(() => null)) as
    | ChatResponseBody
    | ChatErrorBody
    | null;

  if (!response.ok || !data || !("reply" in data)) {
    const message = data && "error" in data ? data.error : "The AI guide is unavailable right now.";
    throw new Error(message);
  }

  return data.reply;
}
