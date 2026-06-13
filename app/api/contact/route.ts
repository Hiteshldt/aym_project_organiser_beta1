import { NextRequest, NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

const VALID_TOPICS = new Set(["sales", "help", "feedback", "other"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const {
    name,
    email,
    topic,
    message,
    company: honeypot, // bots fill hidden fields; humans never see this
  } = (body ?? {}) as Record<string, unknown>;

  // Honeypot: silently accept so the bot thinks it succeeded.
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim() : "";
  const cleanTopic = typeof topic === "string" ? topic.trim() : "other";
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (cleanName.length < 2 || cleanName.length > 120) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (cleanMessage.length < 10) {
    return NextResponse.json(
      { error: "Please add a little more detail (10+ characters)." },
      { status: 400 }
    );
  }
  if (cleanMessage.length > 5000) {
    return NextResponse.json(
      { error: "That message is a bit long — keep it under 5000 characters." },
      { status: 400 }
    );
  }

  const result = await sendContactMessage({
    name: cleanName,
    email: cleanEmail,
    topic: VALID_TOPICS.has(cleanTopic) ? cleanTopic : "other",
    message: cleanMessage,
  });

  if (!result.ok) {
    console.error("[contact] send failed:", result.error);
    return NextResponse.json(
      { error: "Couldn't send right now. Email us at contact@ayuvam.com." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
