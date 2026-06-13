import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaddle, getUserSubscription } from "@/lib/billing/paddle-server";

export const dynamic = "force-dynamic";

// Creates a Paddle customer-portal session so the user can manage payment
// method, view invoices, or cancel — all hosted by Paddle.
export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paddle = getPaddle();
  if (!paddle) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 500 });
  }

  const sub = await getUserSubscription(session.user.id);
  if (!sub?.paddleCustomerId) {
    return NextResponse.json(
      { error: "No billing account yet" },
      { status: 400 }
    );
  }

  try {
    const portal = await paddle.customerPortalSessions.create(
      sub.paddleCustomerId,
      sub.paddleSubscriptionId ? [sub.paddleSubscriptionId] : []
    );
    const url = portal?.urls?.general?.overview;
    if (!url) {
      return NextResponse.json({ error: "Could not open portal" }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[paddle] portal session failed:", e);
    return NextResponse.json({ error: "Could not open portal" }, { status: 502 });
  }
}
