import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Registration Update | Florida Badgers FCA",
  description: "Registration not accepted update and next steps for Florida Badgers FCA players.",
};

export default function RegistrationNotAcceptedPage() {
  return (
    <main className="bg-[#F0F0F0]">
      <section className="px-6 xl:px-10 py-28">
        <div className="max-w-[980px] mx-auto border border-[#D9D9D9] bg-white p-8 sm:p-10">
          <div className="relative w-20 h-20 mx-auto">
            <Image
              src="/images/Florida Badgers.png"
              alt="Florida Badgers logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.24em] text-[#B0B0B0]">
            Registration Status
          </p>
          <h1 className="mt-2 text-center text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            Not Accepted
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-center text-[#2E2424] leading-relaxed">
            Your registration is currently not accepted. This can happen due to limited spots
            or roster decisions for the current period.
          </p>
          <p className="mt-3 max-w-3xl mx-auto text-center text-[#2E2424] leading-relaxed">
            You can contact the club for feedback or submit a new registration for upcoming
            sessions and tryouts.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 bg-black text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#2E2424] transition-colors"
            >
              <Mail size={15} />
              Contact The Club
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 border border-[#B0B0B0] text-black font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#F0F0F0] transition-colors"
            >
              <RotateCcw size={15} />
              Register Again
            </Link>
          </div>

          <div className="mt-8 border-t border-[#D9D9D9] pt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#2E2424] hover:text-black"
            >
              Back To Home <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
