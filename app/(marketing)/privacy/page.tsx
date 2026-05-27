import type { Metadata } from "next";
import LegalPage, {
  LegalH2,
  LegalP,
  LegalList,
  LegalLi,
} from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Ayuvam handles your data. Honest, plain English, no dark patterns.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy"
      italicTitle="policy."
      updated="May 28, 2026"
    >
      <LegalP>
        This policy explains what data Ayuvam collects, how we use it, and
        what control you have over it. We try to keep it readable and short.
        If anything's unclear, email{" "}
        <a
          href="mailto:hello@ayuvam.com"
          className="text-accent underline underline-offset-4"
        >
          hello@ayuvam.com
        </a>{" "}
        and we'll clarify.
      </LegalP>

      <LegalH2>1. What we collect</LegalH2>
      <LegalP>
        We try to collect as little as possible. Specifically:
      </LegalP>
      <LegalList>
        <LegalLi>
          <strong>Account info:</strong> name, email, and (if you sign up with
          Google) your Google profile picture URL. If you use email/password,
          we store a hashed password — never the original.
        </LegalLi>
        <LegalLi>
          <strong>Workspace content:</strong> files, links, tags, notes, and
          anything else you upload. We store these so the Service can show
          them back to you and to the clients you share with.
        </LegalLi>
        <LegalLi>
          <strong>Share-link metadata:</strong> when a share link was last
          accessed, the email address it was sent to (if you provided one).
          We use this so you can see whether your client has opened the link.
        </LegalLi>
        <LegalLi>
          <strong>Basic usage logs:</strong> the standard request logs your
          browser sends to any web server (IP address, user agent, request
          paths). We use these for debugging and abuse prevention.
        </LegalLi>
      </LegalList>
      <LegalP>
        We do <strong>not</strong> use third-party analytics, behavioral
        tracking pixels, or session replay tools.
      </LegalP>

      <LegalH2>2. How we use it</LegalH2>
      <LegalP>
        We use your data only to operate Ayuvam:
      </LegalP>
      <LegalList>
        <LegalLi>To deliver the Service (storing and showing your work).</LegalLi>
        <LegalLi>
          To send transactional emails — sign-in confirmations, share-link
          invites you trigger, billing receipts.
        </LegalLi>
        <LegalLi>
          To respond to your support questions.
        </LegalLi>
        <LegalLi>
          To enforce our{" "}
          <a
            href="/terms"
            className="text-accent underline underline-offset-4"
          >
            terms
          </a>{" "}
          and prevent abuse.
        </LegalLi>
      </LegalList>
      <LegalP>
        We do not sell your data. We do not use it to train AI models. We
        don't email you marketing without your consent.
      </LegalP>

      <LegalH2>3. Who we share it with</LegalH2>
      <LegalP>
        Ayuvam runs on a few infrastructure services. Each handles a specific
        slice of your data, under their own privacy policies:
      </LegalP>
      <LegalList>
        <LegalLi>
          <strong>Neon</strong> — hosts the Postgres database that stores your
          account and workspace metadata. (neon.tech)
        </LegalLi>
        <LegalLi>
          <strong>Vercel</strong> — hosts the application code and (via Vercel
          Blob) the files you upload. (vercel.com)
        </LegalLi>
        <LegalLi>
          <strong>Resend</strong> — sends transactional emails on our behalf.
          (resend.com)
        </LegalLi>
        <LegalLi>
          <strong>Google</strong> — handles OAuth sign-in when you choose
          "Continue with Google".
        </LegalLi>
        <LegalLi>
          <strong>Paddle</strong> — processes payments and handles tax
          compliance when you subscribe to a paid plan. (paddle.com)
        </LegalLi>
      </LegalList>
      <LegalP>
        We don't share your data with anyone else. We only disclose data to
        law enforcement if we receive a valid legal request and have no choice.
      </LegalP>

      <LegalH2>4. Your clients</LegalH2>
      <LegalP>
        When you create a share link, the people who open it can see the
        content of that workspace. That's the whole point. We don't collect
        information from those visitors beyond standard request logs and the
        "last accessed" timestamp on the share link.
      </LegalP>

      <LegalH2>5. Retention</LegalH2>
      <LegalP>
        We keep your data for as long as your account is active. When you
        delete your account, we delete your content within 30 days. Some
        backup snapshots may persist for up to 90 days, after which they're
        permanently removed.
      </LegalP>
      <LegalP>
        Some data we retain longer for legal/financial reasons — for example,
        invoice records we're required to keep for tax purposes.
      </LegalP>

      <LegalH2>6. Your rights</LegalH2>
      <LegalP>You can, at any time:</LegalP>
      <LegalList>
        <LegalLi>Access the data we have about you (most of it is visible in the app).</LegalLi>
        <LegalLi>Correct anything wrong by editing your profile or content.</LegalLi>
        <LegalLi>
          Request an export of your content. Email{" "}
          <a
            href="mailto:hello@ayuvam.com"
            className="text-accent underline underline-offset-4"
          >
            hello@ayuvam.com
          </a>{" "}
          — we'll respond within 7 days.
        </LegalLi>
        <LegalLi>
          Delete your account. This permanently removes your content (see §5).
        </LegalLi>
      </LegalList>
      <LegalP>
        If you're in the EU/UK and want to invoke GDPR rights, write to the
        same email — we honor those rights regardless of where you live.
      </LegalP>

      <LegalH2>7. Cookies</LegalH2>
      <LegalP>
        We use cookies for one purpose only: to keep you signed in. The
        session cookie is set by our authentication library and expires when
        you sign out or after 30 days of inactivity. We don't use third-party
        cookies, advertising cookies, or analytics cookies.
      </LegalP>

      <LegalH2>8. Security</LegalH2>
      <LegalP>
        We use industry-standard practices to protect your data — TLS in
        transit, at-rest encryption on the database and file storage, hashed
        passwords (bcrypt), and the principle of least privilege internally.
      </LegalP>
      <LegalP>
        No system is perfectly secure. If we discover a breach affecting your
        data, we'll notify you promptly and explain what happened and what to
        do.
      </LegalP>

      <LegalH2>9. Children</LegalH2>
      <LegalP>
        Ayuvam is for use by people 18 and older. We don't knowingly collect
        data from anyone under 18. If we learn we have, we delete it
        immediately.
      </LegalP>

      <LegalH2>10. Changes</LegalH2>
      <LegalP>
        We may update this policy occasionally. If we make material changes,
        we'll notify you in-app or by email at least 30 days before they take
        effect.
      </LegalP>

      <LegalH2>11. Contact</LegalH2>
      <LegalP>
        Privacy questions, data requests, or concerns — write to{" "}
        <a
          href="mailto:hello@ayuvam.com"
          className="text-accent underline underline-offset-4"
        >
          hello@ayuvam.com
        </a>
        . We try to respond within 7 days.
      </LegalP>
    </LegalPage>
  );
}
