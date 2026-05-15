"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const juniorOnlyGallery = [
  "/images/fc%20badgers%20juniors/DSC06364.jpg",
  "/images/fc%20badgers%20juniors/DSC06367.jpg",
  "/images/fc%20badgers%20juniors/DSC06370.jpg",
  "/images/fc%20badgers%20juniors/DSC06371.jpg",
  "/images/fc%20badgers%20juniors/DSC06371_1.jpg",
  "/images/fc%20badgers%20juniors/DSC06373.jpg",
  "/images/fc%20badgers%20juniors/DSC06373_1.jpg",
  "/images/fc%20badgers%20juniors/DSC06380.jpg",
  "/images/fc%20badgers%20juniors/DSC06387.jpg",
  "/images/fc%20badgers%20juniors/DSC06395.jpg",
  "/images/fc%20badgers%20juniors/DSC06409.jpg",
  "/images/fc%20badgers%20juniors/DSC06411.jpg",
  "/images/fc%20badgers%20juniors/DSC06414.jpg",
  "/images/fc%20badgers%20juniors/DSC06428.jpg",
  "/images/fc%20badgers%20juniors/DSC06430.jpg",
  "/images/fc%20badgers%20juniors/DSC06432.jpg",
  "/images/fc%20badgers%20juniors/DSC06439.jpg",
  "/images/fc%20badgers%20juniors/DSC06443.jpg",
  "/images/fc%20badgers%20juniors/DSC06450.jpg",
  "/images/fc%20badgers%20juniors/DSC06460.jpg",
  "/images/fc%20badgers%20juniors/DSC06477.jpg",
  "/images/fc%20badgers%20juniors/DSC06486.jpg",
  "/images/fc%20badgers%20juniors/DSC06487.jpg",
  "/images/fc%20badgers%20juniors/DSC06498.jpg",
  "/images/fc%20badgers%20juniors/DSC06509.jpg",
  "/images/fc%20badgers%20juniors/DSC06511.jpg",
  "/images/fc%20badgers%20juniors/DSC06513.jpg",
  "/images/fc%20badgers%20juniors/DSC06516.jpg",
  "/images/fc%20badgers%20juniors/DSC06557.jpg",
  "/images/fc%20badgers%20juniors/DSC06575.jpg",
  "/images/fc%20badgers%20juniors/DSC06602.jpg",
  "/images/fc%20badgers%20juniors/DSC06618.jpg",
  "/images/fc%20badgers%20juniors/DSC06633.jpg",
  "/images/fc%20badgers%20juniors/DSC06641.jpg",
  "/images/fc%20badgers%20juniors/DSC06656.jpg",
  "/images/fc%20badgers%20juniors/DSC06667.jpg",
  "/images/fc%20badgers%20juniors/DSC06676.jpg",
  "/images/fc%20badgers%20juniors/DSC06681.jpg",
  "/images/fc%20badgers%20juniors/DSC06688.jpg",
  "/images/fc%20badgers%20juniors/DSC06716.jpg",
];

const progressSliderImages = [
  "/images/fc%20badgers%20juniors/DSC06681.jpg",
  "/images/fc%20badgers%20juniors/DSC06498.jpg",
  "/images/fc%20badgers%20juniors/DSC06633.jpg",
  "/images/fc%20badgers%20juniors/DSC06575.jpg",
  "/images/fc%20badgers%20juniors/DSC06716.jpg",
];

const juniorsHeroImage = "/images/fc%20badgers%20juniors/DSC06688.jpg";

const ageGroups = [
  {
    label: "U5-10 years",
    detail: "Technical initiation, coordination, ball control, and confidence.",
  },
  {
    label: "11-13 years",
    detail: "Tactical progression, collective play, and execution speed.",
  },
  {
    label: "14-17 years",
    detail: "Competitive intensity, tactical responsibility, and physical preparation.",
  },
  {
    label: "18+ years",
    detail: "Transition to senior football standards and match performance.",
  },
];

const juniorPillars = [
  "Discipline and respect for structure",
  "Continuous technical development",
  "Game intelligence and tactical reading",
  "Human-centered player support",
];

const weeklyFlow = [
  { title: "Technical Session", text: "Ball touches, control, passing, and movement." },
  { title: "Tactical Session", text: "Team organization, transitions, and match scenarios." },
  { title: "Match Day", text: "Competition application, evaluation, and progression." },
];

export default function JuniorsPage() {
  const [currentProgressImage, setCurrentProgressImage] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentProgressImage((prev) => (prev + 1) % progressSliderImages.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden text-white px-6 xl:px-10 pt-32 pb-16">
        <Image
          src={juniorsHeroImage}
          alt="Florida Badgers Juniors hero"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-[1320px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white mb-3">Academy Juniors</p>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.04]">
            Juniors Program
          </h1>
          <p className="mt-4 text-white max-w-3xl leading-relaxed">
            The Florida Badgers junior pathway is designed to develop complete players through technique, mindset, discipline, and team spirit.
          </p>
        </div>
      </section>

      <section className="px-6 xl:px-10 pt-12 pb-6">
        <div className="max-w-[1320px] mx-auto">
          <div className="bg-white border border-slate-200 p-6 sm:p-10">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black mb-3">Our School / Welcome</p>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mb-5">
                  Florida Badgers FCA<br />
                  <span className="text-black">Football Academy</span>
                </h2>
                <p className="text-black leading-relaxed mb-4">
                  At our Football Academy, your children will be able to learn how to play football, develop their skills, improve techniques and find new friends. We help our students become champions and continue to play football professionally.
                </p>
                <p className="text-black leading-relaxed">
                  Moreover, we accept students of any age! Learn more about how you can become a member and which benefits you get from attending our school!
                </p>
              </div>
              
              <div className="bg-white border border-slate-200 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black mb-2">Trainers</p>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-6">Coaching Staff</h3>
                
                <div className="space-y-4">
                  <article className="flex items-center gap-4 bg-white border border-slate-200 p-4">
                    <div className="w-12 h-12 bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 text-white font-bold">
                      S
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Stephen</h4>
                      <p className="text-xs font-bold text-black uppercase tracking-wider mt-0.5">Kids Academy Coach</p>
                    </div>
                  </article>
                  
                  <article className="flex items-center gap-4 bg-white border border-slate-200 p-4">
                    <div className="w-12 h-12 bg-[#1e3a5f] flex items-center justify-center flex-shrink-0 text-white font-bold">
                      L
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-slate-900">Luvins</h4>
                      <p className="text-xs font-bold text-black uppercase tracking-wider mt-0.5">Kids Academy Coach</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 py-6">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <article className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black mb-4">Juniors Structure</p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Development Objective</h2>
            <p className="text-black leading-relaxed mb-4">
              Our junior academy supports players step by step, with guidance adapted to age and level.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {juniorPillars.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-black">
                  <CheckCircle2 size={16} className="mt-0.5 text-black" />
                  {item}
                </div>
              ))}
            </div>
          </article>

          <aside className="bg-white border border-slate-200 overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image
                key={progressSliderImages[currentProgressImage]}
                src={progressSliderImages[currentProgressImage]}
                alt="Florida Badgers Juniors training"
                fill
                className="object-cover transition-opacity duration-500"
                priority
              />
            </div>
            <div className="p-5 border-t border-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black">Progress</p>
              <p className="mt-2 text-sm text-black leading-relaxed">
                Each player follows a clear development path, from fundamentals to competition.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-12">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black">Juniors Photos</p>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">Square Gallery</h2>
            </div>
            <Link
              href="/academy/about"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-black hover:text-black"
            >
              About Club <ArrowRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3 snap-x snap-mandatory">
            {juniorOnlyGallery.map((src, index) => (
              <div key={src} className="group relative aspect-square w-[220px] sm:w-[250px] lg:w-[280px] overflow-hidden border border-slate-200 bg-white snap-start flex-shrink-0">
                <Image
                  src={src}
                  alt={`Florida Badgers Juniors ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 220px, (max-width: 1024px) 250px, 280px"
                />
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-14">
        <div className="max-w-[1320px] mx-auto grid xl:grid-cols-[1fr_1fr] gap-6">
          <div className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black mb-5">Age Categories</p>
            <div className="grid md:grid-cols-2 gap-4">
              {ageGroups.map((group) => (
                <article key={group.label} className="border border-slate-200 bg-white p-4">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{group.label}</h3>
                  <p className="mt-2 text-sm text-black leading-relaxed">{group.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black mb-5">Weekly Cycle</p>
            <div className="space-y-3">
              {weeklyFlow.map((item) => (
                <article key={item.title} className="border border-slate-200 bg-white p-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-black leading-relaxed">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-20">
        <div className="max-w-[1320px] mx-auto border border-slate-200 bg-white p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black mb-3">Join The Juniors</p>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                Join Florida Badgers Juniors Today
              </h2>
              <p className="mt-3 text-black leading-relaxed">
                U5 category is now open. Register your child and start the development pathway with Florida Badgers Juniors.
              </p>

              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <article className="border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-black">Registration Fee</p>
                  <p className="mt-1 text-2xl font-black text-black">$150</p>
                  <p className="mt-1 text-sm text-black">One-time enrollment payment. Equipment included.</p>
                </article>
                <article className="border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-black">Monthly Fee</p>
                  <p className="mt-1 text-2xl font-black text-black">$50 / month</p>
                  <p className="mt-1 text-sm text-black">Weekly training sessions with academy coaches.</p>
                </article>
              </div>
            </div>

            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-2 bg-black text-white font-bold uppercase tracking-wider px-8 py-4 hover:bg-[#2E2E2E] active:bg-white active:text-black transition-all"
            >
              Register Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

