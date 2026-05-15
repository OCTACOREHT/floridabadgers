import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home, Mail } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-[#F0F0F0]">
      <section className="min-h-[70vh] px-6 xl:px-10 py-28">
        <div className="max-w-[920px] mx-auto border border-[#D9D9D9] bg-white p-8 sm:p-12 text-center">
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
            <Image
              src="/images/Florida Badgers.png"
              alt="Florida Badgers logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-[#B0B0B0]">Error 404</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-tight text-black">
            Page Not Found
          </h1>
          <p className="mt-4 text-[#2E2E2E] max-w-2xl mx-auto leading-relaxed">
            The page you are looking for does not exist or has been moved.
            Return to the Florida Badgers homepage or contact the club.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-black text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#2E2E2E] transition-colors"
            >
              <Home size={15} />
              Back Home
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 border border-[#B0B0B0] text-black font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#F0F0F0] transition-colors"
            >
              <Mail size={15} />
              Contact Us
            </Link>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#2E2E2E] hover:text-black"
          >
            <ArrowLeft size={14} />
            Go Back
          </Link>
        </div>
      </section>
    </main>
  );
}
