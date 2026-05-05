"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { academyMedia } from "@/lib/academyMedia";

const academyImages = [
  "/images/juniors/j1.jpg",
  "/images/juniors/j4.jpg",
  "/images/juniors/j2.jpg",
  "/images/juniors/j5.jpg",
];

const highlights = [
  {
    title: "Club Creation",
    detail:
      "The club was launched in 2018 (formerly Sharks FC), following a field initiative to coach young players.",
  },
  {
    title: "Junior Project",
    detail:
      "A progressive support system by age category, focusing on technique, game intelligence, and discipline.",
  },
  {
    title: "Florida Badgers Identity",
    detail:
      "A culture of hard work, respect, and collective progress, from juniors up to the first team.",
  },
];

const timeline = [
  { year: "2018", title: "Project Start", text: "Launch of the initial group under the name Sharks FC." },
  { year: "2019-2021", title: "Structuring", text: "Implementation of regular training and an educational framework." },
  { year: "2022+", title: "Florida Badgers", text: "Consolidation of the club identity and academy growth." },
];

export default function AcademyPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % academyImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="relative h-screen md:min-h-screen flex items-center overflow-hidden bg-slate-900 text-white px-6 xl:px-10 pt-20 pb-10">
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
                src={academyImages[index]}
                alt="Florida Badgers Academy"
                fill
                className="object-cover object-center"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-slate-900/60" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="absolute inset-0 z-10 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 24%, #1e3a5f 0, transparent 36%), radial-gradient(circle at 85% 70%, #ffffff 0, transparent 24%)",
          }}
        />
        
        <div className="relative z-20 max-w-[1320px] mx-auto text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/90 mb-3">Florida Badgers Academy</p>
            <h1 className="text-4xl sm:text-5xl xl:text-7xl font-black uppercase tracking-tight leading-[1.04]">
              Training.
              <br />
              Discipline.
              <br />
              Progression.
            </h1>
            <p className="mt-6 text-white/80 max-w-2xl leading-relaxed text-lg">
              Discover the junior world and the club&apos;s history: from its creation in 2018 to the construction of a sustainable football project.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/academy/juniors"
                className="inline-flex items-center gap-2 bg-[#1e3a5f] px-8 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#374151] transition-colors shadow-xl"
              >
                See Juniors <ArrowRight size={15} />
              </Link>
              <Link
                href="/academy/about"
                className="inline-flex items-center gap-2 border border-white/40 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-slate-900 transition-all"
              >
                About The Club
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 py-12">
        <div className="max-w-[1320px] mx-auto grid md:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <article key={item.title} className="bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="bg-white border border-slate-200 p-6 sm:p-10">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Our School / Welcome</p>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-5">
                  Florida Badgers FCA<br />
                  <span className="text-[#1e3a5f]">Football Academy</span>
                </h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  At our Football Academy, your children will be able to learn how to play football, develop their skills, improve techniques and find new friends. We help our students become champions and continue to play football professionally.
                </p>
                <p className="text-slate-700 leading-relaxed">
                  Moreover, we accept students of any age! Learn more about how you can become a member and which benefits you get from attending our school!
                </p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Trainers</p>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-6">Coaching Staff</h3>
                
                <div className="space-y-4">
                  <article className="flex items-center gap-4 bg-white border border-slate-200 p-4">
                    <div className="w-12 h-12 bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 text-white font-bold">
                      S
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Stephen</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Kids Academy Coach</p>
                    </div>
                  </article>
                  
                  <article className="flex items-center gap-4 bg-white border border-slate-200 p-4">
                    <div className="w-12 h-12 bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 text-white font-bold">
                      L
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Luvins</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Kids Academy Coach</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-12">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-2 gap-6">
          <article className="group bg-white border border-slate-200 overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image
                src={academyMedia.juniorsCard}
                alt="Florida Badgers Juniors"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Junior Development</p>
              <h3 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">Juniors Program</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Age categories, training content, and highlights gallery from Facebook.
              </p>
              <Link
                href="/academy/juniors"
                className="mt-5 inline-flex items-center gap-2 bg-[#1e3a5f] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#374151] transition-colors"
              >
                Explore <ArrowRight size={15} />
              </Link>
            </div>
          </article>

          <article className="group bg-white border border-slate-200 overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image
                src={academyMedia.aboutCard}
                alt="Florida Badgers About Club"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Club Identity</p>
              <h3 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900">About Club</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Club history, management team, field vision, and development goals.
              </p>
              <Link
                href="/academy/about"
                className="mt-5 inline-flex items-center gap-2 border border-slate-300 px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-900 hover:border-slate-500 transition-colors"
              >
                Discover <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-14">
        <div className="max-w-[1320px] mx-auto bg-white border border-slate-200 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">Club Milestones</p>
          <div className="grid md:grid-cols-3 gap-4">
            {timeline.map((item) => (
              <article key={item.title} className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{item.year}</p>
                <h4 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">{item.title}</h4>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="mt-0.5 text-slate-800" />
              Structured supervision for youth and families.
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="mt-0.5 text-slate-800" />
              Long-term vision: individual progress and collective performance.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

