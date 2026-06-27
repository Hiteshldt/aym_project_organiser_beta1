import { Resend } from "resend";

/* ────────────────────────────────────────────────────────────────
   Resend client — lazy. If RESEND_API_KEY isn't set, send becomes
   a no-op so we don't crash share creation.
   ──────────────────────────────────────────────────────────────── */

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

function getFromAddress(): string {
  const email = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const name = process.env.RESEND_FROM_NAME ?? "Ayuvam";
  return `${name} <${email}>`;
}

function getAppUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "https://ayuvam.com").replace(/\/$/, "");
}

type SendResult = { ok: true; id: string } | { ok: false; error: string };

/* ────────────────────────────────────────────────────────────────
   Share invite email
   ──────────────────────────────────────────────────────────────── */

export async function sendShareInvite(opts: {
  to: string;
  studioName: string;     // the company sharing the workspace
  label: string | null;   // optional context, shown above the CTA
  shareUrl: string;
  inviterName: string;    // who created the share
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const subject = `${opts.studioName} shared a workspace with you`;

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: opts.to,
      subject,
      html: renderShareInviteHtml(opts),
      text: renderShareInviteText(opts),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown email error";
    return { ok: false, error: msg };
  }
}

/* ────────────────────────────────────────────────────────────────
   Contact form → inbox (contact@ayuvam.com)
   The visitor's address is set as reply-to, so hitting "Reply" in the
   inbox replies straight to them.
   ──────────────────────────────────────────────────────────────── */

const CONTACT_INBOX = "contact@ayuvam.com";

const TOPIC_LABELS: Record<string, string> = {
  sales: "Sales & demos",
  help: "Help & support",
  feedback: "Feedback / idea",
  other: "General",
};

export async function sendContactMessage(opts: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const topicLabel = TOPIC_LABELS[opts.topic] ?? TOPIC_LABELS.other;
  const subject = `[${topicLabel}] ${opts.name} via ayuvam.com`;

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: CONTACT_INBOX,
      replyTo: opts.email,
      subject,
      html: renderContactHtml({ ...opts, topicLabel }),
      text: renderContactText({ ...opts, topicLabel }),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown email error";
    return { ok: false, error: msg };
  }
}

/* ────────────────────────────────────────────────────────────────
   Welcome email — sent once when a paid subscription first activates
   (fired from the Paddle webhook). Paddle sends its own receipt; this
   is our own thank-you + "here's where to go next".
   ──────────────────────────────────────────────────────────────── */

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string; // the buyer's name
  planName: string; // "Solo" / "Studio" / "Agency"
}): Promise<SendResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const subject = `Welcome to Ayuvam ${opts.planName}`;

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: opts.to,
      subject,
      html: renderWelcomeHtml(opts),
      text: renderWelcomeText(opts),
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown email error";
    return { ok: false, error: msg };
  }
}

function renderWelcomeHtml(opts: {
  name: string;
  planName: string;
}): string {
  const firstName = opts.name.trim().split(" ")[0] || "there";
  const appUrl = getAppUrl();
  const billingUrl = `${appUrl}/settings`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to Ayuvam ${escapeHtml(opts.planName)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fbfaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f0f0f;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;">
      You're on Ayuvam ${escapeHtml(opts.planName)} — here's where to pick up.
    </div>

    <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
      <!-- Brand -->
      <div style="margin-bottom:40px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;color:#0f0f0f;">Ayuvam</span>
      </div>

      <!-- Card -->
      <div style="background:#ffffff;border:1px solid #ecead9;border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 8px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c84b31;">
          You're on ${escapeHtml(opts.planName)}
        </p>

        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:32px;line-height:1.15;color:#0f0f0f;letter-spacing:-0.01em;">
          Welcome, <span style="font-style:italic;">${escapeHtml(firstName)}.</span>
        </h1>

        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5a5a57;">
          Thank you for upgrading. Your ${escapeHtml(opts.planName)} plan is active — more workspaces, more room, and the full toolkit are unlocked on your account.
        </p>

        <!-- Next steps -->
        <table style="width:100%;border-collapse:collapse;margin:0 0 28px;font-size:14px;line-height:1.5;color:#1a1613;">
          <tr><td style="padding:5px 0;">• Spin up a workspace for each client</td></tr>
          <tr><td style="padding:5px 0;">• Add folders, links, and files — drop in the real work</td></tr>
          <tr><td style="padding:5px 0;">• Share a read-only link; your client just clicks to view</td></tr>
        </table>

        <!-- CTA -->
        <a href="${escapeAttr(appUrl)}/workspace"
           style="display:inline-block;background:#c84b31;color:#ffffff;text-decoration:none;font-weight:500;font-size:14px;padding:14px 24px;border-radius:999px;letter-spacing:0;">
          Open Ayuvam &nbsp;→
        </a>

        <p style="margin:28px 0 0;font-size:13px;line-height:1.55;color:#7a7773;">
          Manage your plan, payment method, and invoices anytime in
          <a href="${escapeAttr(billingUrl)}" style="color:#c84b31;text-decoration:none;">Settings → Plan &amp; billing</a>.
          A receipt for this payment comes separately from our payment provider.
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top:32px;padding:0 8px;">
        <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:#7a7773;">
          Questions or anything not working? Just reply — a real person reads it.
        </p>
      </div>

      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #ecead9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#b8b5af;">
          Powered by <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#7a7773;">Ayuvam</span>
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function renderWelcomeText(opts: { name: string; planName: string }): string {
  const firstName = opts.name.trim().split(" ")[0] || "there";
  const appUrl = getAppUrl();
  return [
    `Welcome to Ayuvam ${opts.planName}`,
    "",
    `Hi ${firstName},`,
    "",
    `Thank you for upgrading. Your ${opts.planName} plan is active — more workspaces, more room, and the full toolkit are unlocked on your account.`,
    "",
    "Where to start:",
    "• Spin up a workspace for each client",
    "• Add folders, links, and files — drop in the real work",
    "• Share a read-only link; your client just clicks to view",
    "",
    `Open Ayuvam: ${appUrl}/workspace`,
    "",
    `Manage your plan, payment method, and invoices anytime in Settings → Plan & billing: ${appUrl}/settings`,
    "A receipt for this payment comes separately from our payment provider.",
    "",
    "Questions or anything not working? Just reply — a real person reads it.",
    "",
    "— Powered by Ayuvam",
  ].join("\n");
}

function renderContactHtml(opts: {
  name: string;
  email: string;
  topicLabel: string;
  message: string;
}): string {
  const { name, email, topicLabel, message } = opts;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>New message via ayuvam.com</title>
  </head>
  <body style="margin:0;padding:0;background:#fbfaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f0f0f;-webkit-font-smoothing:antialiased;">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
      <div style="margin-bottom:32px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;color:#0f0f0f;">Ayuvam</span>
      </div>

      <div style="background:#ffffff;border:1px solid #ecead9;border-radius:16px;padding:36px 32px;">
        <p style="margin:0 0 8px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c84b31;">
          ${escapeHtml(topicLabel)}
        </p>
        <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;line-height:1.2;color:#0f0f0f;letter-spacing:-0.01em;">
          New message from <span style="font-style:italic;">${escapeHtml(name)}</span>
        </h1>

        <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#7a7773;width:80px;">Name</td>
            <td style="padding:6px 0;color:#0f0f0f;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7a7773;">Email</td>
            <td style="padding:6px 0;"><a href="mailto:${escapeAttr(email)}" style="color:#c84b31;text-decoration:none;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7a7773;vertical-align:top;">Topic</td>
            <td style="padding:6px 0;color:#0f0f0f;">${escapeHtml(topicLabel)}</td>
          </tr>
        </table>

        <div style="border-top:1px solid #ecead9;padding-top:20px;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#1a1613;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </div>

      <p style="margin:24px 8px 0;font-size:12px;color:#b8b5af;">
        Reply to this email to respond to ${escapeHtml(name)} directly.
      </p>
    </div>
  </body>
</html>`;
}

function renderContactText(opts: {
  name: string;
  email: string;
  topicLabel: string;
  message: string;
}): string {
  return [
    `New message via ayuvam.com`,
    "",
    `Topic: ${opts.topicLabel}`,
    `Name:  ${opts.name}`,
    `Email: ${opts.email}`,
    "",
    "Message:",
    opts.message,
    "",
    `— Reply to this email to respond to ${opts.name} directly.`,
  ].join("\n");
}

/* ────────────────────────────────────────────────────────────────
   Template — HTML (table-light, inline styles, brand-aligned)
   ──────────────────────────────────────────────────────────────── */

function renderShareInviteHtml(opts: {
  studioName: string;
  label: string | null;
  shareUrl: string;
  inviterName: string;
}): string {
  const { studioName, label, shareUrl, inviterName } = opts;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(studioName)} shared a workspace with you</title>
  </head>
  <body style="margin:0;padding:0;background:#fbfaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f0f0f;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;">
      ${escapeHtml(inviterName)} from ${escapeHtml(studioName)} shared a workspace with you on Ayuvam.
    </div>

    <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
      <!-- Brand -->
      <div style="margin-bottom:40px;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;color:#0f0f0f;">Ayuvam</span>
      </div>

      <!-- Card -->
      <div style="background:#ffffff;border:1px solid #ecead9;border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 8px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#7a7773;">
          Shared workspace
        </p>

        <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:32px;line-height:1.15;color:#0f0f0f;letter-spacing:-0.01em;">
          <span style="font-style:italic;">${escapeHtml(studioName)}</span> shared a<br/>workspace with you.
        </h1>

        <p style="margin:0 0 28px;font-size:15px;line-height:1.55;color:#5a5a57;">
          ${escapeHtml(inviterName)} has given you view-only access to ${escapeHtml(studioName)}'s shared workspace${
            label ? ` — <em style="color:#0f0f0f;">${escapeHtml(label)}</em>` : ""
          }. No account required. Just click below.
        </p>

        <!-- CTA -->
        <a href="${escapeAttr(shareUrl)}"
           style="display:inline-block;background:#c84b31;color:#ffffff;text-decoration:none;font-weight:500;font-size:14px;padding:14px 24px;border-radius:999px;letter-spacing:0;">
          Open the workspace &nbsp;→
        </a>

        <p style="margin:28px 0 0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;color:#b8b5af;word-break:break-all;">
          Or paste this link in your browser:<br/>
          <span style="color:#7a7773;">${escapeHtml(shareUrl)}</span>
        </p>
      </div>

      <!-- Footnotes -->
      <div style="margin-top:24px;padding:0 8px;">
        <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:#7a7773;">
          This link gives you read-only access. ${escapeHtml(studioName)} can revoke it at any time.
        </p>
        <p style="margin:0;font-size:12px;color:#b8b5af;">
          If you weren't expecting this, you can safely ignore the email.
        </p>
      </div>

      <!-- Footer -->
      <div style="margin-top:48px;padding-top:24px;border-top:1px solid #ecead9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#b8b5af;">
          Powered by <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;color:#7a7773;">Ayuvam</span>
        </p>
      </div>
    </div>
  </body>
</html>`;
}

function renderShareInviteText(opts: {
  studioName: string;
  label: string | null;
  shareUrl: string;
  inviterName: string;
}): string {
  return [
    `${opts.studioName} shared a workspace with you`,
    "",
    `${opts.inviterName} has given you view-only access to ${opts.studioName}'s shared workspace${
      opts.label ? ` — ${opts.label}` : ""
    }. No account required.`,
    "",
    `Open the workspace:`,
    opts.shareUrl,
    "",
    "This link gives you read-only access. The studio can revoke it at any time.",
    "",
    "— Powered by Ayuvam",
  ].join("\n");
}

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
