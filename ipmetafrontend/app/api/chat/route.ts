import { NextRequest, NextResponse } from "next/server";
import { ChatMessage, MAX_HISTORY_MESSAGES, MAX_MESSAGE_LENGTH } from "@/lib/chat";

const SYSTEM_PROMPT = `You are the in-app guide for the "GitHub Developer Dashboard" web app. Help users
understand how to use THIS app. Keep answers short, friendly, and specific to the app's actual features:

- Home page: type any GitHub username into the search box and press Search (or click one of the
  suggested usernames) to open their dashboard at /u/<username>.
- The dashboard page shows: the user's profile (avatar, name, bio, company, location, join date), four
  stat tiles (followers, following, public repos, stars earned), a "Top languages" breakdown bar chart
  computed from their non-fork repositories, and a repository grid.
- The repository grid has sort pills (Recently updated, Most stars, Most forks, Name) that re-fetch and
  re-sort the list, and a "Load more" button at the bottom that fetches additional pages without
  reloading the page.
- If a username doesn't exist on GitHub, the app shows a friendly "user not found" page with a link back
  to search.
- Data comes from the public GitHub REST API via this app's own backend, which caches responses briefly
  and handles GitHub's rate limits gracefully.

If asked something unrelated to using this app (general coding help, unrelated trivia, etc.), politely
redirect back to what you can help with: navigating and using this dashboard. Do not make up features
that don't exist in the list above.`;

function isValidHistory(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item): item is ChatMessage =>
      typeof item === "object" &&
      item !== null &&
      (item as ChatMessage).role &&
      ["user", "assistant"].includes((item as ChatMessage).role) &&
      typeof (item as ChatMessage).content === "string" &&
      (item as ChatMessage).content.length > 0 &&
      (item as ChatMessage).content.length <= MAX_MESSAGE_LENGTH,
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI guide isn't configured yet. Set OPENAI_API_KEY on the server." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!isValidHistory(messages)) {
    return NextResponse.json(
      { error: "Expected a non-empty array of { role, content } messages." },
      { status: 400 },
    );
  }

  const trimmedHistory = messages.slice(-MAX_HISTORY_MESSAGES);
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  let openaiResponse: Response;
  try {
    openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmedHistory],
        temperature: 0.4,
        max_tokens: 400,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the AI service." }, { status: 502 });
  }

  if (!openaiResponse.ok) {
    const detail = await openaiResponse.text().catch(() => "");
    return NextResponse.json(
      { error: `AI service error (${openaiResponse.status}): ${detail.slice(0, 200)}` },
      { status: 502 },
    );
  }

  const data = (await openaiResponse.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    return NextResponse.json({ error: "The AI service returned an empty response." }, { status: 502 });
  }

  return NextResponse.json({ reply });
}
