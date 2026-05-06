import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, Clock, ArrowRight } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Florida Badgers FCA",
  description: "Contact Florida Badgers FCA for academy, first team, and club information.",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 mb-3">
      {children}
    </span>
  );
}

export default function ContactsPage() {
  return (
    <main className="">
      <section className="bg-slate-900 text-white px-6 xl:px-10 pt-32 pb-20 border-b border-white/10">
        <div className="max-w-[1320px] mx-auto">
          <SectionLabel>Contacts</SectionLabel>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.02]">
            Get In Touch
          </h1>
          <p className="mt-5 text-white/70 max-w-2xl leading-relaxed">
            Contact Florida Badgers FCA for first team information, academy registration, partnerships,
            and general club support.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 xl:px-10 py-16">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-3 gap-5">
          <article className="border border-slate-200 bg-slate-50 p-5">
            <div className="w-10 h-10 bg-[#1e3a5f]/10 flex items-center justify-center mb-4">
              <MapPin size={18} className="text-[#1e3a5f]" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">Address</h2>
            <p className="text-slate-700 leading-relaxed">1901 N. Seacrest Blvd, Boynton Beach FL 33435</p>
          </article>

          <article className="border border-slate-200 bg-slate-50 p-5">
            <div className="w-10 h-10 bg-[#1e3a5f]/10 flex items-center justify-center mb-4">
              <Phone size={18} className="text-[#1e3a5f]" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">Phone</h2>
            <p className="text-slate-700 leading-relaxed">+1 914-426-1526</p>
            <p className="text-slate-700 leading-relaxed">+1 305-988-9700</p>
          </article>

          <article className="border border-slate-200 bg-slate-50 p-5">
            <div className="w-10 h-10 bg-[#1e3a5f]/10 flex items-center justify-center mb-4">
              <Mail size={18} className="text-[#1e3a5f]" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-2">Email</h2>
            <p className="text-slate-700 leading-relaxed break-all">info@floridabadgersfca.com</p>
            <p className="text-slate-700 leading-relaxed break-all">academy@floridabadgersfca.com</p>
          </article>
        </div>
      </section>

      <section className="bg-slate-100 px-6 xl:px-10 py-16 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <article className="border border-slate-200 bg-white p-6 sm:p-8">
            <SectionLabel>Contact Form</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-6">
              Send Us A Message
            </h2>

            <ContactForm />
          </article>

          <article className="border border-slate-200 bg-slate-900 text-white p-6 sm:p-8">
            <SectionLabel>Club Hours</SectionLabel>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Office Schedule</h2>

            <div className="space-y-4">
              {[
                { day: "Monday", hours: "9:00 AM - 6:00 PM" },
                { day: "Tuesday", hours: "9:00 AM - 6:00 PM" },
                { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
                { day: "Thursday", hours: "9:00 AM - 6:00 PM" },
                { day: "Friday", hours: "9:00 AM - 6:00 PM" },
                { day: "Saturday", hours: "By Appointment" },
                { day: "Sunday", hours: "Closed" },
              ].map((row) => (
                <div
                  key={row.day}
                  className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 text-sm"
                >
                  <span className="font-bold uppercase tracking-wider">{row.day}</span>
                  <span className="text-white/70">{row.hours}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Clock size={14} />
                <span>Response time: usually within 24-48 hours.</span>
              </div>
              <div className="mt-4">
                <Link
                  href="/join"
                  className="inline-flex items-center gap-2 border border-white/20 text-white font-bold uppercase tracking-wider px-6 py-3 hover:border-white transition-colors"
                >
                  Register Now <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
