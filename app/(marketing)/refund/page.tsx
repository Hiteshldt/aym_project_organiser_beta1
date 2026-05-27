import type { Metadata } from "next";
import LegalPage, {
  LegalH2,
  LegalP,
  LegalList,
  LegalLi,
} from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Ayuvam's refund policy. 14-day money-back on first payment. No questions asked.",
};

export default function RefundPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund"
      italicTitle="policy."
      updated="May 28, 2026"
    >
      <LegalP>
        We want you to be confident trying Ayuvam. This page explains when
        refunds are available, how to request one, and where we can't issue
        them.
      </LegalP>

      <LegalH2>1. 14-day money-back on your first payment</LegalH2>
      <LegalP>
        If you've never paid for Ayuvam before and you're not happy with your
        first subscription payment, write to us within{" "}
        <strong>14 days of the charge</strong> and we'll refund it in full. No
        questions, no fine print.
      </LegalP>
      <LegalP>
        This applies to your <em>first</em> paid charge only — whether monthly
        or annual.
      </LegalP>

      <LegalH2>2. Annual plans</LegalH2>
      <LegalP>
        Annual plans bill once per year. If you cancel partway through, you
        keep access until the end of the current billing period — we don't
        prorate refunds for unused months.
      </LegalP>
      <LegalP>
        Exception: if you cancel an annual plan{" "}
        <strong>within 14 days of renewal</strong>, we'll refund the year in
        full and downgrade you back to Free.
      </LegalP>

      <LegalH2>3. Monthly plans</LegalH2>
      <LegalP>
        Monthly subscriptions don't get prorated refunds. Cancel any time —
        access continues until the end of the current month, and you won't be
        billed again.
      </LegalP>

      <LegalH2>4. When refunds aren't available</LegalH2>
      <LegalList>
        <LegalLi>
          You've passed the 14-day window for the first payment or annual
          renewal.
        </LegalLi>
        <LegalLi>
          Your account was suspended or terminated for violating our{" "}
          <a
            href="/terms"
            className="text-accent underline underline-offset-4"
          >
            terms
          </a>
          .
        </LegalLi>
        <LegalLi>
          You've been a customer for several months and request a refund for
          past months you used.
        </LegalLi>
        <LegalLi>
          Chargebacks or disputes filed without contacting us first — we'll
          work with you directly if you reach out.
        </LegalLi>
      </LegalList>

      <LegalH2>5. How to request a refund</LegalH2>
      <LegalP>
        Email{" "}
        <a
          href="mailto:hello@ayuvam.com"
          className="text-accent underline underline-offset-4"
        >
          hello@ayuvam.com
        </a>{" "}
        with:
      </LegalP>
      <LegalList>
        <LegalLi>The email address on your Ayuvam account.</LegalLi>
        <LegalLi>The date of the charge you'd like refunded.</LegalLi>
        <LegalLi>
          A line about what didn't work — not required, but it helps us
          improve.
        </LegalLi>
      </LegalList>
      <LegalP>
        We aim to respond within 2 business days. Refunds typically appear on
        your card within 5–10 business days after we process them, depending
        on your bank.
      </LegalP>

      <LegalH2>6. Payment processor</LegalH2>
      <LegalP>
        Payments are handled by Paddle, who acts as the Merchant of Record for
        Ayuvam. Refunds are issued through Paddle to the original payment
        method. We initiate the refund — Paddle delivers it.
      </LegalP>

      <LegalH2>7. Questions</LegalH2>
      <LegalP>
        We'd rather talk than argue. If you're unhappy with Ayuvam, please
        reach out at{" "}
        <a
          href="mailto:hello@ayuvam.com"
          className="text-accent underline underline-offset-4"
        >
          hello@ayuvam.com
        </a>{" "}
        — we want to know why, and we'll do right by you.
      </LegalP>
    </LegalPage>
  );
}
