import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/constants";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import styles from "@/components/legal/LegalContent.module.css";

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) terms of service: the rules for using this website and for holding a DCITC member account at Dhaka College.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/terms",
    title: "Terms of Service | Dhaka College IT Club",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen pb-16 pt-28 text-muted md:pb-24">
      <div className="mx-auto w-full max-w-[720px] px-6">
        <header className="mb-12">
          <p className="mb-3 type-overline uppercase tracking-[0.3em] text-faint">
            Legal / Terms
          </p>
          <h1 className="type-h1 mb-4">
            Terms of Service
          </h1>
          <p className="type-body leading-relaxed text-subtle">
            The rules for using this site and for holding a DCITC account.
          </p>
          <p className="mt-6 type-overline uppercase tracking-[0.18em] text-faint sm:text-2xs sm:tracking-[0.2em]">
            Last updated{" "}
            <time dateTime={LEGAL.LAST_UPDATED_ISO} className="text-muted">
              {LEGAL.LAST_UPDATED}
            </time>
          </p>
        </header>

        <div className={`border-t border-line pt-10 ${styles.text}`}>
          <section>
            <h2>About these terms</h2>
            <p>
              These terms are an agreement between you and Dhaka College
              Information &amp; Technology Club (DCITC) about your use of this
              website and any account you hold on it. By using the site or
              signing in, you accept them. If you do not accept them, please do
              not create or use an account.
            </p>
            <p>
              The{" "}
              <Link href="/privacy">Privacy Policy</Link> explains how we handle
              personal information and forms part of these terms.
            </p>
          </section>

          <section>
            <h2>Who can use the site</h2>
            <p>
              The public pages are open to everyone. Accounts are intended for
              DCITC members and Dhaka College students, which is why sign-up asks
              for your HSC batch. If you are under 18, please make sure a parent
              or guardian knows about and agrees to the account.
            </p>
          </section>

          <section>
            <h2>Your account</h2>
            <ul>
              <li>
                <strong>Accurate details.</strong> Give your real name, email
                address, and HSC batch, and keep them current so the club can
                reach you and identify you correctly.
              </li>
              <li>
                <strong>One account per person.</strong> We ask that each member
                keeps a single account rather than several. The site does not
                enforce this automatically.
              </li>
              <li>
                <strong>Your password.</strong> Choose a password you do not use
                elsewhere and keep it to yourself. Anyone with your password and
                session can act as you, so tell us promptly if you think someone
                else has access.
              </li>
              <li>
                <strong>Google sign-in.</strong> If you sign in with Google, you
                are also relying on the security of that Google account. We
                receive only the details described in the Privacy Policy.
              </li>
            </ul>
          </section>

          <section>
            <h2>Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>use the site for anything unlawful;</li>
              <li>
                try to access another person&apos;s account, the admin console,
                or data you have not been given access to;
              </li>
              <li>
                probe, scan, or attempt to bypass the site&apos;s authentication,
                rate limits, or other security controls;
              </li>
              <li>
                overload the site, scrape it at a rate that affects other people,
                or interfere with its normal operation;
              </li>
              <li>
                send abusive, threatening, misleading, or spam messages through
                the contact form, or impersonate someone else;
              </li>
              <li>
                upload or distribute malicious code, or content that infringes
                someone else&apos;s rights.
              </li>
            </ul>
            <p>
              The site applies rate limits to sign-in, sign-up, password reset,
              contact messages, and uploads. Repeated attempts may be refused
              temporarily.
            </p>
          </section>

          <section>
            <h2>Club content</h2>
            <p>
              The club&apos;s name, logo, leadership profiles, achievements, and
              intel articles belong to DCITC or are used with permission. You may
              read, quote, and share them with attribution. Please do not
              republish them as your own work or use them commercially without
              asking us first.
            </p>
            <p>
              Content is published by club administrators. It is written for
              general information and may be updated, corrected, or removed at
              any time.
            </p>
          </section>

          <section>
            <h2>Messages you send us</h2>
            <p>
              Messages sent through the contact form are delivered to the club by
              email. Please do not send passwords, financial details, or anything
              else you would not want a club member to read. We read what you
              send and reply where a reply is useful, but we cannot promise to
              answer every message.
            </p>
          </section>

          <section>
            <h2>Membership</h2>
            <p>
              Enrolment happens through a form the club links from the member
              dashboard, which opens outside this site. The club sets the annual
              fee shown on the dashboard, and any payment is handled through the
              process described on that form or by the club directly.
            </p>
            <p>
              No payment is processed on this site, and the site does not store
              payment details. Membership benefits, deadlines, and decisions
              about who is enrolled are the club&apos;s to make.
            </p>
          </section>

          <section>
            <h2>Third-party services</h2>
            <p>
              The site uses outside services for sign-in, the contact map, email
              delivery, database and image storage, hosting, and the membership
              form. When you use those parts of the site you also rely on those
              providers, and their own terms and privacy policies apply to what
              they handle.
            </p>
          </section>

          <section>
            <h2>Availability</h2>
            <p>
              The site is provided as it is. We may change, suspend, or take it
              offline — in whole or in part — for maintenance, security, or club
              reasons, and we do not promise that it will always be available or
              that any particular feature will remain.
            </p>
          </section>

          <section>
            <h2>Suspension and deletion</h2>
            <p>
              We may suspend or remove an account that breaks these terms, puts
              other people or the site at risk, or is no longer connected to the
              club. Where we do, existing sessions may stop working immediately.
            </p>
            <p>
              You can ask for your account to be deleted at any time by emailing{" "}
              <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a>{" "}
              from the address on the account. There is no self-service deletion
              control; a club member handles the request by hand.
            </p>
          </section>

          <section>
            <h2>Disclaimers</h2>
            <p>
              The site and its content are provided without warranties of any
              kind. Club information may be incomplete, out of date, or contain
              mistakes, and links to other sites are not an endorsement of them.
              Nothing here is professional advice.
            </p>
          </section>

          <section>
            <h2>Limitation of liability</h2>
            <p>
              To the extent the law allows, DCITC and the people who run this site
              are not liable for indirect or consequential loss arising from your
              use of the site, from content published on it, or from a service
              being unavailable. Nothing in these terms limits a liability that
              cannot lawfully be limited.
            </p>
          </section>

          <section>
            <h2>Changes to these terms</h2>
            <p>
              We may update these terms as the site and the club change. When we
              do, the &ldquo;last updated&rdquo; date at the top of this page
              changes with it. Continuing to use the site after a change means
              you accept the updated terms.
            </p>
          </section>

          <section>
            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of Bangladesh. If something
              goes wrong, please contact the club first so we can try to resolve
              it between us. Disputes that cannot be settled that way belong to
              the courts of Bangladesh.
            </p>
          </section>

          <section>
            <h2>Contact us</h2>
            <p>
              Questions about these terms go to{" "}
              <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a>
              . You can also write to the club at Dhaka College, Dhaka,
              Bangladesh.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
