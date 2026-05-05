import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Florida Badgers FCA",
  description: "Privacy Policy for Florida Badgers FCA.",
};

function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 mt-10 mb-4">
      {number}. {title}
    </h2>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-700 leading-relaxed mb-4">{children}</p>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <li className="text-slate-700 leading-relaxed">{children}</li>;
}

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-slate-100 min-h-screen">
      <section className="px-6 xl:px-10 pt-32 pb-16 border-b border-white/10 bg-slate-900 text-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-white/70 mb-3">Florida Badgers FCA</div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Privacy Policy
          </h1>
          <div className="mt-4 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span>Privacy Policy</span>
          </div>
          <div className="mt-6 max-w-md">
            <input
              type="text"
              placeholder="Search..."
              className="w-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
              aria-label="Search privacy policy"
            />
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 py-12">
        <div className="max-w-[1100px] mx-auto bg-white border border-slate-200 p-6 sm:p-8 lg:p-10">
          <SectionTitle number={1} title="Introduction" />
          <Paragraph>
            Florida Badgers FC (website:{" "}
            <a
              href="https://floridabadgers.com/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-900 font-semibold underline underline-offset-2"
            >
              https://floridabadgers.com/
            </a>
            ) appreciates your business and your trust. This Privacy Policy explains how we collect,
            use, and protect your personal data when you use our website and services.
          </Paragraph>

          <SectionTitle number={2} title="Data Collected" />

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Data Storage Location</h3>
          <Paragraph>
            Our infrastructure may use secure hosting providers in the EU and/or US. We apply technical and
            organizational safeguards to protect personal data and comply with applicable data protection laws.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Registration Data</h3>
          <Paragraph>
            If you register on our website, we may store your username, email address, and any additional
            profile information you provide. You can request updates or deletion of your account data at any time,
            subject to legal and operational requirements.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Support Data</h3>
          <Paragraph>
            If you contact us for assistance, we collect the information you submit (such as name, email, and
            message content) to provide support and follow-up.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Comments</h3>
          <Paragraph>
            When comments are enabled and you leave a comment, we may collect the data shown in the comment form,
            along with technical metadata (such as IP and browser user-agent) for anti-spam and security.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Contact Form</h3>
          <Paragraph>
            Information submitted via our contact form is used only for customer service and operational communication.
            We do not use contact submissions for unrelated marketing without your consent.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Analytics Data</h3>
          <Paragraph>
            We may use analytics tools for aggregated, anonymized usage reporting. We do not intentionally use
            analytics data to directly identify individual users.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">How We Use Personal Data</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <Bullet>Verification and account security.</Bullet>
            <Bullet>Providing technical assistance and customer support.</Bullet>
            <Bullet>Service notifications and important updates.</Bullet>
            <Bullet>Fraud prevention and platform protection.</Bullet>
            <Bullet>Improving website performance and user experience.</Bullet>
          </ul>

          <SectionTitle number={3} title="Embedded Content" />
          <Paragraph>
            Pages on this site may include embedded content (for example, YouTube videos or social media feeds).
            Embedded content behaves the same way as if you visited the source website directly. Those providers
            may collect data, use cookies, and track interactions according to their own policies.
          </Paragraph>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <Bullet>Facebook</Bullet>
            <Bullet>X (Twitter)</Bullet>
            <Bullet>YouTube</Bullet>
          </ul>

          <SectionTitle number={4} title="Cookies" />
          <Paragraph>
            This site uses cookies and similar technologies to improve functionality and user experience.
            Cookies may store preferences, session state, and analytics-related data.
          </Paragraph>
          <Paragraph>
            You can disable cookies in your browser settings. Some features of the site may not function correctly
            if cookies are disabled.
          </Paragraph>

          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">Necessary Cookies</h3>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <Bullet>
              <span className="font-semibold text-slate-900">session_id</span>: Maintains your active browsing session.
            </Bullet>
            <Bullet>
              <span className="font-semibold text-slate-900">csrf_token</span>: Helps protect form submissions against abuse.
            </Bullet>
            <Bullet>
              <span className="font-semibold text-slate-900">consent_preferences</span>: Stores your cookie/privacy preferences.
            </Bullet>
          </ul>

          <SectionTitle number={5} title="Who Has Access To Your Data" />
          <Paragraph>
            If you are not a registered user, we do not keep account-specific profile data about you. If you have
            a registered account, authorized administrators and support staff may access relevant information when
            needed to operate the service and provide support.
          </Paragraph>

          <SectionTitle number={6} title="Third Party Access To Your Data" />
          <Paragraph>
            We do not sell your personal data. We may share limited information with service providers only when required
            to deliver requested services (for example: hosting, analytics, email, and support platforms).
          </Paragraph>

          <SectionTitle number={7} title="How Long We Retain Your Data" />
          <Paragraph>
            We retain personal data only as long as necessary for service delivery, legal compliance, and security.
            You can request deletion of your data, except where retention is required by law.
          </Paragraph>

          <SectionTitle number={8} title="Security Measures" />
          <Paragraph>
            We use SSL/HTTPS across our site to protect data in transit. We also implement reasonable technical
            and organizational safeguards to reduce the risk of unauthorized access, disclosure, or loss.
          </Paragraph>

          <SectionTitle number={9} title="Your Data Rights" />
          <Paragraph>
            Depending on your jurisdiction, you may have rights to access, correct, export, or delete personal data.
            You may also object to certain processing activities or request processing limitations.
          </Paragraph>
          <Paragraph>
            To submit a privacy request, contact us through our contact page or official support email.
          </Paragraph>

          <SectionTitle number={10} title="Third Party Websites" />
          <Paragraph>
            Our website may include links to external websites. We are not responsible for the privacy or security
            practices of third-party websites. Please review their policies before sharing personal information.
          </Paragraph>

          <SectionTitle number={11} title="Release Of Data For Legal Purposes" />
          <Paragraph>
            We may disclose personal information when required by law, legal process, or to protect rights, safety,
            and service integrity.
          </Paragraph>

          <SectionTitle number={12} title="Amendments" />
          <Paragraph>
            We may update this Privacy Policy from time to time. Updates will be posted on this page with an
            effective date, and continued use of the website indicates acceptance of the updated terms.
          </Paragraph>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <div className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">Florida Badgers FCA</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
              <Link href="/news" className="hover:text-slate-900 transition-colors">News</Link>
              <Link href="/contacts" className="hover:text-slate-900 transition-colors">Contacts</Link>
              <Link href="/shop" className="hover:text-slate-900 transition-colors">Shop</Link>
              <Link href="/support" className="hover:text-slate-900 transition-colors">Support our mission</Link>
              <Link href="/team" className="hover:text-slate-900 transition-colors">Team</Link>
            </div>
            <p className="text-xs text-slate-500 mt-5">FloridaBadgersFCA © 2026. All Rights Reserved.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

