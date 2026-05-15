import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import {
  RiFacebookFill,
  RiTwitterXFill,
  RiInstagramLine,
  RiYoutubeFill,
} from "@remixicon/react";

const FOOTER_LINKS = [
  { label: "Home", href: "/" },
  { label: "Men's First Team", href: "/first-team" },
  { label: "Match Schedule", href: "/schedule" },
  { label: "News", href: "/news" },
  { label: "Contacts", href: "/contacts" },
  { label: "Privacy Policy", href: "/privacy-policy" },
];

const SOCIAL_LINKS = [
  { icon: <RiFacebookFill size={16} />, href: "https://www.facebook.com/share/1BBXhVuuEU/", label: "Facebook" },
  { icon: <RiTwitterXFill size={16} />, href: "https://x.com/flbadgersfc", label: "X" },
  { icon: <RiInstagramLine size={16} />, href: "https://www.instagram.com/floridabadgersfc", label: "Instagram" },
  { icon: <RiYoutubeFill size={16} />, href: "https://www.youtube.com/@FloridaBadgersfc", label: "YouTube" },
];

export function SiteFooter() {
  return (
    <>
      <section className="bg-[#B0B0B0] py-14 md:py-20 px-6 xl:px-10 border-t border-[#D9D9D9]">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#2E2E2E] flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-wider text-black mb-1">Address</div>
              <div className="text-[#2E2E2E] text-sm">1901 N. Seacrest Blvd, Boynton Beach FL 33435</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#2E2E2E] flex items-center justify-center flex-shrink-0">
              <Phone size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-wider text-black mb-1">Phone</div>
              <div className="text-[#2E2E2E] text-sm">+1 914-426-1526</div>
              <div className="text-[#2E2E2E] text-sm">+1 305-988-9700</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#2E2E2E] flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm uppercase tracking-wider text-black mb-1">Email</div>
              <div className="text-[#2E2E2E] text-sm break-all">info@floridabadgersfca.com</div>
              <div className="text-[#2E2E2E] text-sm break-all">academy@floridabadgersfca.com</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black py-10 px-6 xl:px-10 border-t border-white/10">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image src="/images/Florida Badgers.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <div className="font-black text-white text-sm uppercase tracking-wider">Florida Badgers FCA</div>
              <div className="text-white/40 text-xs">FloridaBadgersFCA (c) 2026. All Rights Reserved.</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/50 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-4">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center border border-white/20 text-white/50 hover:border-white hover:text-white transition-all"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
