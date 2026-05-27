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
