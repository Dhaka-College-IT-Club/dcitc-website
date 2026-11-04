import type { Metadata } from "next";
import { LEGAL } from "@/constants";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import styles from "@/components/legal/LegalContent.module.css";

const DESCRIPTION =
  "Dhaka College IT Club (DCITC) privacy policy: what this site collects, how it is stored, who can access it, and how to request correction or deletion.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: {
    siteName: "Dhaka College IT Club",
    type: "website",
    locale: "en_US",
    url: "/privacy",
    title: "Privacy Policy | Dhaka College IT Club",
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg pb-16 pt-28 text-muted md:pb-24">
      <div className="mx-auto w-full max-w-[720px] px-6">
        <header className="mb-12">
          <p className="mb-3 type-overline uppercase tracking-[0.3em] text-faint">
            Legal / Privacy
          </p>
          <h1 className="type-h1 mb-4">
            Privacy Policy
          </h1>
          <p className="type-body leading-relaxed text-subtle">
            What the club collects through this site, why we keep it, and how to
            have it corrected or removed.
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
            <h2>Who we are</h2>
            <p>
              Dhaka College Information &amp; Technology Club (DCITC) is a
              student technology club at Dhaka College in Dhaka, Bangladesh.
              This website is the club&apos;s public home and the place where
              members manage their accounts.
            </p>
            <p>
              For any question about this policy, write to{" "}
              <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2>The short version</h2>
            <div className={styles.lede}>
              <p>
                We collect the details you give us when you create an account,
                join the club, or send us a message — plus the security records
                needed to keep sign-in safe. We use them to run the site and the
                club&apos;s membership.
              </p>
              <p>
                We do not sell your information, we do not run advertising or
                analytics trackers, and we do not pass your details to anyone
                beyond the services described below. The rest of this page
                explains that in more detail.
              </p>
            </div>
          </section>

          <section>
            <h2>Information you give us</h2>
            <ul>
              <li>
                <strong>Creating an account.</strong> Your name, email address,
                HSC batch, and a password. The password is stored only as a
                one-way hash, so nobody at the club can read it.
              </li>
              <li>
                <strong>Signing in with Google.</strong> If you choose Google
                sign-in, Google tells us your email address, your display name,
                and an identifier for your Google account. We use the email to
                match you to an existing account. We never receive your Google
                password.
              </li>
              <li>
                <strong>Signing up or resetting a password.</strong> We email a
                six-digit code to confirm the address belongs to you. The code
                expires after ten minutes and can only be used a limited number
                of times.
              </li>
              <li>
                <strong>Recovering a forgotten email.</strong> If you cannot
                remember which address you registered with, you can enter your
                name and HSC batch. We then email a reminder to the address on
                that account; the address is never shown in the browser.
              </li>
              <li>
                <strong>The contact form.</strong> Your name, email address, and
                the message you write. It is sent to the club by email and is
                not stored as a list of enquiries in the site database.
              </li>
              <li>
                <strong>The membership form.</strong> Enrolment opens a form in a
                new tab that is hosted outside this site. Whatever you enter
                there is handled by that form and its provider, not by us. This
                site shows the annual fee the club sets but does not process
                payments.
              </li>
            </ul>
          </section>

          <section>
            <h2>Information created automatically</h2>
            <ul>
              <li>
                <strong>Cookies.</strong> Three cookies, all httpOnly and
                SameSite=Lax, and marked Secure when the site runs over HTTPS:{" "}
                <strong>dcitc_at</strong> holds a signed-in member session for
                seven days, <strong>dcitc_admin</strong> holds an administrator
                session for seven days, and <strong>dcitc_oauth_state</strong>{" "}
                protects the Google sign-in round trip for five minutes. There
                are no advertising or analytics cookies.
              </li>
              <li>
                <strong>Security records.</strong> One-time codes are kept as
                hashes with an expiry time, an attempt count, and the moment
                they were used. These records are what let us refuse a reused or
                expired code.
              </li>
              <li>
                <strong>Rate limiting.</strong> Sign-in, sign-up, password
                reset, contact messages, and uploads are limited per network
                address. Sign-in, sign-up, and password reset also count the
                email address in the request, so repeated guessing against one
                account is slowed. Uploads are limited per administrator.
              </li>
              <li>
                <strong>Request logs.</strong> The API writes one line per
                request containing a random request ID, the method, the path,
                the response status, and how long it took. It does not record
                cookies, request bodies, or your network address in normal
                operation. A temporary diagnostic setting can add the address;
                it stays off unless an operator turns it on.
              </li>
              <li>
                <strong>No analytics or advertising.</strong> The site runs no
                third-party analytics, pixels, or advertising trackers, and we
                do not build profiles of visitors.
              </li>
            </ul>
          </section>

          <section>
            <h2>Public content about people</h2>
            <p>
              Leadership profiles, achievements, and intel articles are public,
              and they may name a person and show their role, batch, photograph,
              and links to social profiles. Club administrators publish that
              content. Uploaded images are served from public storage, so anyone
              with the link can view them.
            </p>
            <p>
              If you appear in something published here and want it changed or
              removed, email us and we will handle it.
            </p>
          </section>

          <section>
            <h2>How we use information</h2>
            <ul>
              <li>To create and run your account and keep you signed in.</li>
              <li>To confirm that an email address belongs to you.</li>
              <li>To answer messages sent through the contact form.</li>
              <li>To publish the club&apos;s leadership, achievements, and intel.</li>
              <li>
                To keep the site secure — refusing reused codes, limiting
                repeated attempts, and investigating abuse.
              </li>
              <li>To keep the club&apos;s own record of who holds an account.</li>
            </ul>
            <p>
              We do not use your information for advertising, and we do not sell
              or rent it.
            </p>
          </section>

          <section>
            <h2>Who can access it</h2>
            <ul>
              <li>
                <strong>You.</strong> Your own account details and membership
                card in the member dashboard.
              </li>
              <li>
                <strong>Club administrators.</strong> The admin console is for
                leadership, achievements, intel, and site settings. It does not
                list member accounts.
              </li>
              <li>
                <strong>Super administrators.</strong> Manage administrator
                accounts and read the audit log of admin activity.
              </li>
              <li>
                <strong>Technical maintainers.</strong> The people who operate
                the database, file storage, and servers have infrastructure-level
                access, limited to what their work requires.
              </li>
            </ul>
          </section>

          <section>
            <h2>Third parties</h2>
            <p>
              A few outside services make the site work. Each one only receives
              what its role requires.
            </p>
            <ul>
              <li>
                <strong>Google.</strong> Handles sign-in if you choose it, and
                supplies the map embedded in the contact section. When the map
                loads, Google may receive your network address and browser
                details under its own privacy policy.
              </li>
              <li>
                <strong>Supabase.</strong> Hosts the database that stores
                accounts and club content, and the storage that serves uploaded
                images.
              </li>
              <li>
                <strong>Our email provider.</strong> Delivers one-time codes,
                email-recovery messages, and contact-form notifications. Those
                messages pass through the provider to reach you or the club.
              </li>
              <li>
                <strong>Our hosting providers.</strong> Serve the website and the
                API, and therefore process requests made to them.
              </li>
              <li>
                <strong>The membership form.</strong> Hosted by whichever form
                service the club links to. Your submission there is governed by
                that service&apos;s own policy.
              </li>
            </ul>
          </section>

          <section>
            <h2>How we store and protect it</h2>
            <p>
              Passwords and one-time codes are stored as hashes rather than
              readable text. Sessions live in httpOnly cookies that page scripts
              cannot read, and connections use HTTPS in production. Access to the
              database and servers is limited to the people who need it.
            </p>
            <p>
              No system is perfectly secure. If you think your account has been
              accessed by someone else, email us so we can help.
            </p>
          </section>

          <section>
            <h2>How long we keep it</h2>
            <p>
              Account information is kept for as long as the account exists.
              Security records are kept for as long as they are useful for
              protecting the site. Messages are kept for as long as needed to
              deal with them, and published content stays up until it is removed.
            </p>
            <p>
              We do not publish fixed retention periods because how long a record
              is needed depends on what it is for. If you want to know about a
              particular record, ask us.
            </p>
          </section>

          <section>
            <h2>Members under 18</h2>
            <p>
              Many DCITC members are HSC students and may be under 18. If you are
              under 18, please make sure a parent or guardian knows about the
              account and agrees to it. If they would rather you did not have
              one, ask us to delete it.
            </p>
          </section>

          <section>
            <h2>Correcting or deleting your information</h2>
            <p>
              There is no self-service control for editing or deleting an
              account. Email{" "}
              <a href={`mailto:${LEGAL.CONTACT_EMAIL}`}>{LEGAL.CONTACT_EMAIL}</a>{" "}
              from the address on the account, tell us what you want changed or
              removed, and a club member will handle the request by hand and
              confirm back to you.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              We may update this policy as the site changes. When we do, the
              &ldquo;last updated&rdquo; date at the top of this page changes
              with it. Please check back occasionally.
            </p>
          </section>

          <section>
            <h2>Contact us</h2>
            <p>
              Questions, corrections, and deletion requests all go to the same
              place:{" "}
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
