import type { Metadata } from "next";
import LegalPage, {
  LegalH2,
  LegalP,
  LegalList,
  LegalLi,
} from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The agreement between Ayuvam and the people who use it. Plain English, no surprises.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of"
      italicTitle="service."
      updated="May 28, 2026"
    >
      <LegalP>
        These terms govern your use of Ayuvam ("the Service"), a client
        deliverables portal operated by Ayuvam ("we", "us", or "Ayuvam"). By
        creating an account or using the Service, you agree to be bound by
        these terms. If you don't agree, please don't use the Service.
      </LegalP>

      <LegalH2>1. The Service</LegalH2>
      <LegalP>
        Ayuvam is a hosted software-as-a-service that helps studios, agencies,
        and freelancers organize work for their clients and share it through
        view-only links. We provide the tools; you decide how to use them.
      </LegalP>

      <LegalH2>2. Your account</LegalH2>
      <LegalP>
        To use most features of Ayuvam you need an account. You're responsible
        for:
      </LegalP>
      <LegalList>
        <LegalLi>The accuracy of the information you provide.</LegalLi>
        <LegalLi>
          Keeping your account credentials secure. Don't share your login.
        </LegalLi>
        <LegalLi>
          All activity that happens under your account, including by team
          members you invite.
        </LegalLi>
        <LegalLi>
          Notifying us promptly at{" "}
          <a
            href="mailto:hello@ayuvam.com"
            className="text-accent underline underline-offset-4"
          >
            hello@ayuvam.com
          </a>{" "}
          if you suspect unauthorized access.
        </LegalLi>
      </LegalList>

      <LegalH2>3. Your content</LegalH2>
      <LegalP>
        You own everything you upload to Ayuvam — files, links, notes, tags.
        We claim no ownership over your content. We only process it to provide
        the Service (storage, search, sharing via links you create).
      </LegalP>
      <LegalP>
        You grant us a limited license to host, transmit, and display your
        content as necessary to operate the Service. This license ends when
        you delete the content or your account.
      </LegalP>
      <LegalP>
        You are responsible for ensuring you have the right to upload and
        share whatever you put in Ayuvam — files, links, copyrighted
        materials, client work. Don't upload anything you don't have
        permission to.
      </LegalP>

      <LegalH2>4. Acceptable use</LegalH2>
      <LegalP>
        Don't use Ayuvam to:
      </LegalP>
      <LegalList>
        <LegalLi>Store or share illegal content of any kind.</LegalLi>
        <LegalLi>
          Distribute malware, phishing links, or anything intended to harm
          others.
        </LegalLi>
        <LegalLi>
          Infringe on intellectual property rights that aren't yours.
        </LegalLi>
        <LegalLi>
          Spam, harass, or send unsolicited messages through our email system.
        </LegalLi>
        <LegalLi>
          Attempt to reverse-engineer, scrape, or otherwise abuse the Service.
        </LegalLi>
      </LegalList>
      <LegalP>
        We can suspend or terminate accounts that violate these rules without
        notice.
      </LegalP>

      <LegalH2>5. Payment & subscriptions</LegalH2>
      <LegalP>
        Paid plans are billed in advance on a monthly or annual basis. By
        purchasing a plan, you authorize us (and our payment processor,
        Paddle) to charge your payment method on a recurring basis until you
        cancel.
      </LegalP>
      <LegalP>
        Prices may change. We'll give you at least 30 days' notice before any
        change affects your existing subscription. If you don't agree, you can
        cancel before the next billing cycle.
      </LegalP>
      <LegalP>
        For refunds, see our{" "}
        <a
          href="/refund"
          className="text-accent underline underline-offset-4"
        >
          refund policy
        </a>
        .
      </LegalP>

      <LegalH2>6. Cancellation & termination</LegalH2>
      <LegalP>
        You can cancel your subscription at any time. Cancellation takes
        effect at the end of your current billing period — you keep access
        until then.
      </LegalP>
      <LegalP>
        We may suspend or terminate your account if you breach these terms,
        misuse the Service, or fail to pay. We'll give you reasonable notice
        and a chance to fix the issue when we can.
      </LegalP>
      <LegalP>
        When your account is deleted, we delete your content within 30 days,
        except where retention is required by law.
      </LegalP>

      <LegalH2>7. Availability</LegalH2>
      <LegalP>
        We work to keep Ayuvam available 24/7 but make no guarantees. The
        Service is provided "as is." We don't promise uninterrupted operation,
        and we may need to take it offline for maintenance or upgrades.
      </LegalP>

      <LegalH2>8. Limitation of liability</LegalH2>
      <LegalP>
        To the extent permitted by law, Ayuvam is not liable for indirect,
        incidental, or consequential damages arising from your use of the
        Service. Our total liability for any claim is limited to the amount
        you paid us in the 12 months before the claim arose.
      </LegalP>
      <LegalP>
        You agree to use Ayuvam at your own risk. Keep backups of important
        files — we recommend not using Ayuvam as your only copy of anything
        critical.
      </LegalP>

      <LegalH2>9. Changes to these terms</LegalH2>
      <LegalP>
        We may update these terms from time to time. If we make material
        changes, we'll notify you by email or in-app at least 30 days before
        they take effect. Continued use of Ayuvam after that means you accept
        the new terms.
      </LegalP>

      <LegalH2>10. Governing law</LegalH2>
      <LegalP>
        These terms are governed by the laws of India. Any disputes will be
        resolved in the courts of India.
      </LegalP>

      <LegalH2>11. Contact</LegalH2>
      <LegalP>
        Questions, concerns, or notices about these terms — reach us at{" "}
        <a
          href="mailto:hello@ayuvam.com"
          className="text-accent underline underline-offset-4"
        >
          hello@ayuvam.com
        </a>
        .
      </LegalP>
    </LegalPage>
  );
}
