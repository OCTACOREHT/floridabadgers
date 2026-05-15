import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "U23 Team Launch | Florida Badgers FCA",
  description:
    "Florida Badgers FCA officially launches its U23 Team as part of the club's Multi-Divisional Project. Tryouts begin May 23, 2026.",
};

const REGISTER_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc-Uel74bd2lQd12KQbjmCvAxFDvKKWJs9f-htTamLB9B-ZlA/viewform";

const pathway = [
  "Florida Badgers Academy",
  "U18 Team",
  "U23 Team",
  "Reserve Team",
  "Florida Badgers First Team",
];

const focusAreas = [
  "Advanced player development",
  "Competitive match exposure",
  "Physical and tactical preparation",
  "Transition into senior football",
  "College and professional showcase opportunities",
];

const launchMilestones = [
  { label: "Launch", value: "May 10, 2026" },
  { label: "Competition", value: "Not Announced Yet" },
  { label: "Tryouts Start", value: "May 23, 2026" },
  { label: "Tryout Time", value: "7:00 AM" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 mb-3">
      {children}
    </span>
  );
}

export default function U23Page() {
  return (
    <main>
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 24%, #1e3a5f 0, transparent 36%), radial-gradient(circle at 82% 74%, #ffffff 0, transparent 26%)",
          }}
        />
        <div className="relative max-w-[1320px] mx-auto px-6 xl:px-10 pt-32 pb-20">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70 mb-3">
            Multi-Divisional Project
          </p>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.04]">
            Florida Badgers U23
            <br />
            Official Launch
          </h1>
          <p className="mt-5 max-w-3xl text-white/75 leading-relaxed">
            Florida Badgers FCA continues to expand its long-term player development vision with the
            official launch of the U23 Team. The program creates a stronger bridge between youth football,
            reserve-level competition, and first-team opportunities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={REGISTER_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#374151] transition-all"
            >
              Register Now <ArrowRight size={15} />
            </Link>
            <Link
              href="/first-team"
              className="inline-flex items-center gap-2 border border-white/25 text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:border-white transition-all"
            >
              Senior Team Page
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 xl:px-10 py-16 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <article className="border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <SectionLabel>Board Decision</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-5">
              Competition Update
            </h2>
            <p className="text-slate-700 leading-relaxed mb-5">
              Florida Badgers has officially launched the U23 project as part of the club&apos;s long-term
              structure. At this stage, there is no official competition announced yet. The objective remains
              clear: build a merit-based pathway where committed players can progress toward reserve and first-team levels.
            </p>
            <div className="border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Development Pathway</p>
              <p className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 leading-relaxed">
                {pathway.join(" -> ")}
              </p>
            </div>
          </article>

          <aside className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {launchMilestones.map((item) => (
              <article key={item.label} className="border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">{item.value}</p>
              </article>
            ))}
          </aside>
        </div>
      </section>

      <section className="bg-slate-100 px-6 xl:px-10 py-16 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1fr_1fr] gap-6">
          <article className="border border-slate-200 bg-white p-6 sm:p-8">
            <SectionLabel>U23 Program Focus</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-5">
              Building The Next Senior Core
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {focusAreas.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="mt-0.5 text-slate-800" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-slate-200 bg-slate-900 text-white p-6 sm:p-8">
            <SectionLabel>Competition Status</SectionLabel>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-5">No Fixture Announced Yet</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-white/85">
                <Users size={17} className="mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/60">Current Status</p>
                  <p className="font-bold">U23 roster building and trial phase</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-white/85">
                <MapPin size={17} className="mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/60">Tryout Location</p>
                  <p className="font-bold">1901 N. Seacrest Blvd, Boynton Beach FL 33435</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-white/85">
                <Phone size={17} className="mt-0.5" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/60">Tryout Start</p>
                  <p className="font-bold">May 23, 2026 - 7:00 AM</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="bg-white px-6 xl:px-10 py-16 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <article className="border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <SectionLabel>Open Tryouts</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-5">
              Reserve & U23 Tryouts Start May 23
            </h2>
            <p className="text-slate-700 leading-relaxed mb-5">
              Florida Badgers officially opens U23 and Reserve tryouts on May 23, 2026. After launch day,
              weekly sessions continue for players aiming to join the senior development structure.
              The club is looking for serious and committed players ready to compete in a professional environment.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <article className="border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin size={16} className="mt-0.5 text-slate-800" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</p>
                    <p className="mt-1 font-semibold">1901 N. Seacrest Blvd, Boynton Beach FL 33435</p>
                  </div>
                </div>
              </article>
              <article className="border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-2 text-slate-700">
                  <Users size={16} className="mt-0.5 text-slate-800" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Schedule</p>
                    <p className="mt-1 font-semibold">Starts May 23, 2026 - 7:00 AM</p>
                  </div>
                </div>
              </article>
            </div>
          </article>

          <article className="border border-slate-200 bg-white p-6 sm:p-8">
            <SectionLabel>Registration & Info</SectionLabel>
            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-5">Contact The Club</h3>
            <div className="space-y-4 text-slate-700">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-800" />
                <span className="break-all">info@floridabadgersfca.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-800" />
                <span>+1 914-426-1526</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-800" />
                <span>+1 305-988-9700</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={REGISTER_FORM_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#374151] transition-all"
              >
                Register For U23 <ArrowRight size={15} />
              </Link>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 border border-slate-300 text-slate-900 font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:border-slate-500 transition-colors"
              >
                Contact Page
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
