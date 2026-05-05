"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Phone, Mail, Trophy, Users, Star, ChevronRight } from "lucide-react";
import { newsArticles } from "@/lib/news";
import {
  RiAwardLine,
  RiFootballLine,
  RiMedalLine,
  RiTeamLine,
  RiTimerFlashLine,
  RiUserStarLine,
} from "@remixicon/react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const results = [
  {
    home: "Florida Badgers FCA",
    away: "Opponent",
    homeScore: 4,
    awayScore: 0,
    date: "6 August 2025",
    competition: "UPSL Florida South Zone II — Fall 2025",
    homeWin: true,
  },
  {
    home: "City Soccer FC",
    away: "Florida Badgers FCA",
    homeScore: 1,
    awayScore: 5,
    date: "6 August 2025",
    competition: "UPSL Florida South Zone II — Fall 2025",
    homeWin: false,
  },
  {
    home: "Florida Badgers FCA",
    away: "Florida Soccer Soldiers",
    homeScore: 4,
    awayScore: 0,
    date: "6 August 2025",
    competition: "UPSL Florida South Zone II — Fall 2025",
    homeWin: true,
  },
];

const squad = [
  { number: 32, name: "Luvins Dorsainvil", position: "Goalkeeper" },
  { number: 8, name: "Willdieffson Francois", position: "Right Back" },
  { number: 13, name: "Stephen Jean", position: "Left Back" },
  { number: 6, name: "Jonex Sirius", position: "Midfielder" },
  { number: 2, name: "Woodmaël Beauchamps", position: "Central Midfielder" },
  { number: 10, name: "Carl Edens Joseph", position: "Attacking Mid" },
  { number: 11, name: "Altidort", position: "Attacking Mid" },
  { number: 14, name: "John Nalus", position: "Forward" },
  { number: 7, name: "Schimiliquen Castin", position: "Forward" },
  { number: 2, name: "Bens Deliska", position: "Tight End" },
];

const academyCategories = ["U7", "U9", "U11", "U13", "U15", "U17"];

const whyChooseIcons = [
  RiUserStarLine,
  RiMedalLine,
  RiFootballLine,
  RiTimerFlashLine,
  RiTeamLine,
  RiAwardLine,
];

const whyChoose = [
  { icon: "🏋️", title: "Professional Training", desc: "Effective training from our professional coaches" },
  { icon: "🏅", title: "Authority", desc: "Independent referee invited to every game" },
  { icon: "⚽", title: "Youth Academy", desc: "Great training program for younger players" },
  { icon: "⏱️", title: "Precision & Timing", desc: "Players learn to grasp the game faster" },
  { icon: "🤝", title: "Team Unity", desc: "Being a team player has a deeper sense in sports" },
  { icon: "🏆", title: "Championship", desc: "All our players take part in championships" },
];

// ─── ANIMATIONS ──────────────────────────────────────────────────────────────

const homeNewsCards = newsArticles.slice(0, 3);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger: Variants = {
  show: { transition: { staggerChildren: 0.1 } },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-3">
      {children}
    </span>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="pt-[66px] lg:pt-[66px]">

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-slate-900">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/85 to-slate-800/60 z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent z-10" />
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-[1320px] mx-auto px-6 xl:px-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>UPSL Florida South Zone II</SectionLabel>
              <h1 className="text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-[1.05] tracking-tight">
                Florida
                <br />
                <span className="text-white">Badgers</span>
                <br />
                FCA
              </h1>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-white/70 text-lg max-w-md leading-relaxed"
            >
              Our mission is to provide a platform for talented and motivated young
              soccer players to grow, compete, and succeed — both on the field and in
              life.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link href="/academy" className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-7 py-4 transition-all hover:bg-[#374151] hover:gap-3">
                Join the Academy <ArrowRight size={16} />
              </Link>
              <Link href="/schedule" className="inline-flex items-center gap-2 border border-white/30 text-white font-bold text-sm uppercase tracking-wider px-7 py-4 transition-all hover:border-white hover:text-white">
                Match Schedule
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="flex gap-8 pt-2">
              {[
                { value: "2018", label: "Founded" },
                { value: "6", label: "Academy Groups" },
                { value: "UPSL", label: "League" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-white/50 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Logo right side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-72 h-72 xl:w-96 xl:h-96">
              <div className="absolute inset-0 bg-[#1e3a5f]/10 rounded-full blur-3xl" />
              <Image
                src="/images/Florida Badgers.png"
                alt="Florida Badgers FCA"
                fill
                className="object-contain drop-shadow-2xl relative z-10"
                priority
              />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/70" />
          <span className="text-[10px] uppercase tracking-widest text-white/70">Scroll</span>
        </div>
      </section>

      {/* ═══════════════════════ RECENT RESULTS ═══════════════════════ */}
      <section className="bg-white py-20 px-6 xl:px-10">
        <div className="max-w-[1320px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mb-12"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>UPSL 2025</SectionLabel>
              <h2 className="text-4xl font-black uppercase tracking-tight text-black">Recent Results</h2>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {results.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 bg-white border border-slate-200 px-4 py-4 sm:px-5 sm:py-5 hover:border-slate-400 transition-all"
              >
                <div className="min-w-0 text-right">
                  <span className={`font-bold text-sm md:text-base ${r.homeWin ? "text-black" : "text-slate-700"}`}>
                    {r.home}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-1 flex-shrink-0">
                  <span className="text-4xl font-black leading-none text-black">{r.homeScore}</span>
                  <span className="text-slate-300 text-lg">—</span>
                  <span className="text-4xl font-black leading-none text-black">{r.awayScore}</span>
                </div>
                <div className="min-w-0 text-left">
                  <span className={`font-bold text-sm md:text-base ${!r.homeWin ? "text-black" : "text-slate-700"}`}>
                    {r.away}
                  </span>
                </div>
                <div className="col-span-3 mt-3 flex flex-wrap items-center justify-center gap-2 text-center">
                  <span className="text-slate-500 text-xs flex items-center gap-1.5">
                    <Calendar size={12} /> {r.date}
                  </span>
                  <span className="text-slate-300 text-xs">|</span>
                  <span className="text-slate-400 text-[11px] leading-tight">{r.competition}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* NEWS */}
      <section className="bg-slate-100 py-16 px-6 xl:px-10 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mb-8"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>News</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-800">
                The Latest News
              </h2>
            </motion.div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {homeNewsCards.map((article) => (
              <motion.div
                key={article.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="h-full"
              >
                <Link
                  href="/news"
                  className="group block h-full overflow-hidden bg-white border border-slate-200 hover:border-slate-400 transition-all"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5 h-full flex flex-col">
                    <p className="text-slate-500 text-xs font-semibold">{article.date}</p>
                    <h3 className="mt-2 text-2xl sm:text-[30px] leading-[1.08] font-black uppercase tracking-tight text-slate-800">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{article.excerpt}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-6 py-3 hover:bg-[#374151] transition-all"
            >
              View All News <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      {/* ═══════════════════════ MISSION ═══════════════════════ */}
      <section className="bg-slate-800 py-24 px-6 xl:px-10 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1e3a5f]" />
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Who We Are</SectionLabel>
              <h2 className="text-4xl xl:text-5xl font-black uppercase tracking-tight text-white mb-6">
                One of the top football clubs
                <span className="text-white"> USA</span>
              </h2>
            </motion.div>
            <motion.p variants={fadeUp} className="text-white/70 leading-relaxed mb-4">
              Founded in 2018 under the name Sharks FC, when Samson (Samy) saw a group of kids
              playing soccer on the side of the road and invited them to play in a more structured way.
            </motion.p>
            <motion.p variants={fadeUp} className="text-white/70 leading-relaxed mb-8">
              What started as a small group of passionate youths has now become a deeply rooted and
              meaningful club — now known as Florida Badgers.
            </motion.p>
            <motion.div variants={fadeUp} className="flex gap-4">
              <Link href="/about" className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#374151] transition-all">
                Read More <ArrowRight size={15} />
              </Link>
              <Link href="/league" className="inline-flex items-center gap-2 border border-white/20 text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:border-white hover:text-white transition-all">
                Our League
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { icon: <Trophy size={28} />, value: "2018", label: "Year Founded" },
              { icon: <Users size={28} />, value: "10+", label: "Players" },
              { icon: <Star size={28} />, value: "UPSL", label: "League" },
              { icon: <Trophy size={28} />, value: "6", label: "Academy Groups" },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-900 border border-white/10 p-6 flex flex-col gap-3 hover:border-[#1e3a5f]/50 transition-all">
                <div className="text-white">{s.icon}</div>
                <div className="text-3xl font-black text-white">{s.value}</div>
                <div className="text-xs text-white/50 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ SQUAD ═══════════════════════ */}
      <section className="bg-white py-24 px-6 xl:px-10">
        <div className="max-w-[1320px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Men&apos;s First Team</SectionLabel>
              <h2 className="text-4xl font-black uppercase tracking-tight text-black">The Squad</h2>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link href="/team" className="inline-flex items-center gap-2 text-slate-700 text-sm font-bold uppercase tracking-wider hover:gap-3 transition-all">
                View All Players <ChevronRight size={16} />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {squad.map((player, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-slate-50 border border-slate-200 p-4 hover:border-slate-400 transition-all group"
              >
                <div className="text-3xl font-black text-slate-300 group-hover:text-slate-500 transition-colors mb-2">
                  #{player.number}
                </div>
                <div className="font-bold text-sm text-black leading-tight mb-1">{player.name}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">{player.position}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ ACADEMY ═══════════════════════ */}
      <section className="bg-slate-800 py-24 px-6 xl:px-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#1e3a5f]" />
        <div className="max-w-[1320px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Youth Development</SectionLabel>
              <h2 className="text-4xl xl:text-5xl font-black uppercase tracking-tight text-white mb-4">
                Badgers Football Academy
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto leading-relaxed">
                Give your child the chance to shine. At our Football Academy, your children will learn to
                play football, develop their skills, improve techniques and find new friends.
              </p>
            </motion.div>
          </motion.div>

          {/* Academy Categories */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            {academyCategories.map((cat) => (
              <motion.div key={cat} variants={fadeUp}>
                <Link
                  href={`/academy/${cat.toLowerCase()}`}
                  className="flex items-center justify-center w-20 h-20 border-2 border-white/50 text-white font-black text-lg hover:bg-white hover:text-black hover:border-white transition-all"
                >
                  {cat}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Why Choose */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
          >
            {whyChoose.map((item, i) => {
              const Icon = whyChooseIcons[i];

              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-4 bg-slate-100 border border-slate-300 p-5 hover:border-slate-500 hover:bg-white transition-all"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-slate-200 text-slate-800">
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm mb-1">{item.title}</div>
                    <div className="text-slate-600 text-xs leading-relaxed">{item.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="text-center"
          >
            <Link href="/join" className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-10 py-4 hover:bg-[#374151] transition-all">
              Enroll Now <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ SHOP BANNER ═══════════════════════ */}
      <section className="bg-white py-16 px-6 xl:px-10 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Official Merchandise</div>
            <h2 className="text-3xl font-black uppercase text-black tracking-tight">
              Florida Badgers Official Jersey
            </h2>
            <p className="text-slate-600 mt-2 text-sm">Performance Edition — Black, Grey, White</p>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl font-black text-black">$29.99</span>
              <span className="text-slate-400 line-through text-sm">$39.99</span>
              <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-sm">-25%</span>
            </div>
          </div>
          <Link
            href="/shop"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-8 py-4 hover:bg-[#374151] transition-all"
          >
            View All Products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════ CONTACT ═══════════════════════ */}
      <section className="bg-slate-800 py-20 px-6 xl:px-10 border-t border-white/10">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-wider text-white mb-1">Address</div>
              <div className="text-white/60 text-sm">1901 N. Seacrest Blvd, Boynton Beach FL 33435</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
              <Phone size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-wider text-white mb-1">Phone</div>
              <div className="text-white/60 text-sm">+1 914-426-1526</div>
              <div className="text-white/60 text-sm">+1 305-988-9700</div>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#1e3a5f]/10 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-wider text-white mb-1">Email</div>
              <div className="text-white/60 text-sm">info@floridabadgersfca.com</div>
              <div className="text-white/60 text-sm">academy@floridabadgersfca.com</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
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
            {[
              { label: "Home", href: "/" },
              { label: "News", href: "/news" },
              { label: "Contacts", href: "/contacts" },
              { label: "Shop", href: "/shop" },
              { label: "Support our mission", href: "/support" },
              { label: "Team", href: "/team" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="text-white/50 hover:text-white text-xs font-medium uppercase tracking-wider transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex gap-4">
            {[
              { label: "FB", href: "https://www.facebook.com/share/1BBXhVuuEU/" },
              { label: "X", href: "https://x.com/flbadgersfc" },
              { label: "IG", href: "https://www.instagram.com/floridabadgersfc" },
              { label: "YT", href: "https://www.youtube.com/@FloridaBadgersfc" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center border border-white/20 text-white/50 hover:border-white hover:text-white text-xs font-bold transition-all"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}






