"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Phone, Mail, Trophy, Users, Star, ChevronRight } from "lucide-react";
import { newsArticles } from "@/lib/news";
import {
  RiAwardLine,
  RiFootballLine,
  RiMedalLine,
  RiTeamLine,
  RiTimerFlashLine,
  RiUserStarLine,
  RiFacebookFill,
  RiTwitterXFill,
  RiInstagramLine,
  RiYoutubeFill,
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
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 mb-3">
      {children}
    </span>
  );
}

const heroImages = [
  "/images/FB/bah251123001_bad_v_mia-33.jpg",
  "/images/FB/bah251123001_bad_v_mia-79.jpg",
  "/images/FB/bah251123001_bad_v_mia-84.jpg",
];

// ─── NEXT MATCH CONFIG ── update before each game ───────────────────────────
const NEXT_MATCH = {
  opponent: "FC Florida",
  venue: "Broward College North",
  date: "2026-06-07T19:00:00-04:00",
};

type CountdownTime = { days: number; hours: number; minutes: number; seconds: number };
const EMPTY_COUNTDOWN: CountdownTime = { days: 0, hours: 0, minutes: 0, seconds: 0 };

function useCountdown(targetDate: string): CountdownTime {
  const [time, setTime] = useState<CountdownTime>(EMPTY_COUNTDOWN);

  useEffect(() => {
    const targetTime = new Date(targetDate).getTime();

    const update = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setTime(EMPTY_COUNTDOWN);
        return;
      }

      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const timerId = window.setInterval(update, 1000);
    return () => window.clearInterval(timerId);
  }, [targetDate]);

  return time;
}

function HeroBackgroundSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={heroImages[index]}
            alt="Florida Badgers FCA action"
            fill
            className="object-cover object-center"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>
      {/* Extremely subtle overlay to ensure text readability without hiding images */}
      <div className="absolute inset-0 bg-black/5 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/10 to-transparent z-10" />
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function Home() {
  const countdown = useCountdown(NEXT_MATCH.date);
  const opponentWords = NEXT_MATCH.opponent.toUpperCase().split(" ");
  const opponentTopLine = opponentWords[0] ?? "";
  const opponentBottomLine = opponentWords.slice(1).join(" ");

  return (
    <main
      id="home-scroll-root"
      className="h-screen overflow-y-auto snap-y snap-mandatory lg:h-auto lg:overflow-visible lg:snap-none"
    >

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-screen snap-start flex items-center overflow-hidden bg-slate-900">
        <HeroBackgroundSlider />

        {/* Decorative grid overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
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
        <div className="relative z-20 max-w-[1320px] w-full mx-auto px-5 sm:px-6 xl:px-10 pt-14 sm:pt-24 pb-4 sm:pb-12">
          <div className="flex flex-col lg:flex-row items-start sm:items-center lg:items-end justify-between gap-4 sm:gap-10 min-h-[calc(100svh-7rem)] lg:min-h-0">

            {/* Left — Main copy */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={stagger}
              className="flex flex-col gap-4 sm:gap-6 max-w-2xl w-full mt-4 sm:mt-0"
            >
              <motion.div variants={fadeUp}>
                <SectionLabel><span className="invisible">UPSL Florida South Zone II</span></SectionLabel>
                <h1 className="text-5xl sm:text-5xl md:text-6xl xl:text-7xl font-black uppercase leading-[1.03] tracking-tight text-white drop-shadow-xl">
                  Florida
                  <br />
                  <span className="text-white">Badgers</span>
                  <br />
                  FCA
                </h1>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="text-white text-lg sm:text-lg max-w-md leading-relaxed font-bold drop-shadow-md"
              >
                Our mission is to provide a platform for talented and motivated young
                soccer players to grow, compete, and succeed — both on the field and in
                life.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 sm:gap-4">
                <Link href="/academy" className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm sm:text-sm uppercase tracking-wider px-6 sm:px-7 py-3 sm:py-4 transition-all hover:bg-[#374151] hover:gap-3">
                  Join the Academy <ArrowRight size={16} />
                </Link>
                <Link href="/schedule" className="inline-flex items-center gap-2 border border-white/40 text-white font-bold text-sm sm:text-sm uppercase tracking-wider px-6 sm:px-7 py-3 sm:py-4 transition-all hover:border-white hover:text-white bg-white/5 backdrop-blur-sm">
                  Match Schedule
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="flex w-full justify-center sm:justify-start gap-4 sm:gap-8 pt-1 sm:pt-4">
                {[
                  { value: "2018", label: "Founded" },
                  { value: "6", label: "Academy Groups" },
                  { value: "UPSL", label: "League", logo: "/images/UPSL.png" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 sm:gap-3">
                    {s.logo && (
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <Image
                          src={s.logo}
                          alt={`${s.value} Logo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                      <div className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest mt-1">{s.label}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — Match Ticket */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="w-full max-w-[430px] sm:w-fit sm:max-w-full flex-shrink-0 mt-auto sm:mt-auto lg:mt-0"
            >
              <div
                className="relative overflow-hidden rounded-[6px] border border-[#30415c]"
                style={{ background: "rgba(32,45,67,0.96)", backdropFilter: "blur(10px)" }}
              >
                <div className="grid grid-cols-[auto_auto_auto] items-stretch h-full">
                  <div className="pl-3.5 pr-1.5 sm:pl-4 sm:pr-2 md:pl-4 md:pr-2 pt-2.5 pb-2 sm:pt-2.5 sm:pb-2 md:pt-2.5 md:pb-2 flex flex-col justify-start text-left">
                    <p className="text-[7px] sm:text-[7px] md:text-[8px] uppercase tracking-[0.16em] text-[#7d8ca3] leading-[1.05]">
                      Next Match
                    </p>
                    <p className="mt-1 text-[16px] sm:text-[16px] md:text-[22px] uppercase font-bold tracking-[0.01em] text-white leading-[0.9]">
                      VS {opponentTopLine}
                      {opponentBottomLine && (
                        <>
                          <br />
                          {opponentBottomLine}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center px-0.5 sm:px-1">
                    <div className="absolute inset-y-2 md:inset-y-3 left-1/2 -translate-x-1/2 border-l-4 border-dotted border-[#081324]" />
                  </div>

                  <div className="pl-2.5 pr-1.5 sm:pl-2.5 sm:pr-1.5 md:pl-3 md:pr-2 pt-2.5 pb-2 sm:pt-2.5 sm:pb-2 md:pt-2.5 md:pb-2 flex flex-col justify-start">
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-2.5">
                      {[
                        { label: "Days", value: countdown.days },
                        { label: "Hrs", value: countdown.hours },
                        { label: "Mins", value: countdown.minutes },
                        { label: "Secs", value: countdown.seconds },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center justify-center">
                          <span className="text-[24px] sm:text-[20px] md:text-[28px] font-bold tabular-nums text-white leading-none">
                            {String(value).padStart(2, "0")}
                          </span>
                          <span className="mt-0.5 text-[6px] sm:text-[6px] md:text-[7px] uppercase tracking-[0.08em] text-[#7f8ba0]">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1.5 text-center md:text-right text-[5px] sm:text-[5px] md:text-[6px] uppercase tracking-[0.16em] text-[#6e7b8f]">
                      {NEXT_MATCH.venue}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>


      </section>

      {/* ═══════════════════════ RECENT RESULTS ═══════════════════════ */}
      <section className="bg-white py-20 px-6 xl:px-10 snap-start min-h-screen lg:min-h-0">
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
      <section className="bg-slate-100 py-16 px-6 xl:px-10 border-t border-slate-200 snap-start min-h-screen lg:min-h-0">
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
      <section className="bg-slate-800 py-24 px-6 xl:px-10 relative overflow-hidden snap-start min-h-screen lg:min-h-0">
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
              <Link href="/academy/about" className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#374151] transition-all">
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
      <section className="bg-white py-24 px-6 xl:px-10 snap-start min-h-screen lg:min-h-0">
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
      <section className="bg-slate-800 py-24 px-6 xl:px-10 relative overflow-hidden snap-start min-h-screen lg:min-h-0">
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
      <section className="bg-white py-16 px-6 xl:px-10 border-t border-slate-200 snap-start min-h-screen lg:min-h-0">
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
      <section className="bg-slate-800 py-20 px-6 xl:px-10 border-t border-white/10 snap-start min-h-screen lg:min-h-0">
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
              { label: "Privacy Policy", href: "/privacy-policy" },
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
              { icon: <RiFacebookFill size={16} />, href: "https://www.facebook.com/share/1BBXhVuuEU/", label: "Facebook" },
              { icon: <RiTwitterXFill size={16} />, href: "https://x.com/flbadgersfc", label: "X" },
              { icon: <RiInstagramLine size={16} />, href: "https://www.instagram.com/floridabadgersfc", label: "Instagram" },
              { icon: <RiYoutubeFill size={16} />, href: "https://www.youtube.com/@FloridaBadgersfc", label: "YouTube" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center border border-white/20 text-white/50 hover:border-white hover:text-white transition-all"
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}






