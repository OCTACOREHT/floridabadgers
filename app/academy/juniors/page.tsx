import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const juniorOnlyGallery = [
  "/images/juniors/j1.jpg",
  "/images/juniors/j2.jpg",
  "/images/juniors/j3.jpg",
  "/images/juniors/j4.jpg",
  "/images/juniors/j5.jpg",
  "/images/juniors/j6.jpg",
  "/images/juniors/j7.jpg",
  "/images/juniors/j8.jpg",
  "/images/juniors/j9.jpg",
  "/images/juniors/j10.jpg",
  "/images/juniors/j11.jpg",
  "/images/juniors/j12.jpg",
];

const ageGroups = [
  {
    label: "8-10 years",
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
  return (
    <main className="pt-[66px] min-h-screen bg-slate-100">
      <section className="relative overflow-hidden bg-slate-900 text-white px-6 xl:px-10 py-16">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 16% 24%, #1e3a5f 0, transparent 34%), radial-gradient(circle at 82% 68%, #ffffff 0, transparent 22%)",
          }}
        />
        <div className="relative max-w-[1320px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70 mb-3">Academy / Juniors</p>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.04]">
            Juniors Program
          </h1>
          <p className="mt-4 text-white/75 max-w-3xl leading-relaxed">
            The Florida Badgers junior pathway is designed to develop complete players through technique, mindset, discipline, and team spirit.
          </p>
        </div>
      </section>

      <section className="px-6 xl:px-10 pt-12 pb-6">
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

      <section className="px-6 xl:px-10 py-6">
        <div className="max-w-[1320px] mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <article className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Juniors Structure</p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Development Objective</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Our junior academy supports players step by step, with guidance adapted to age and level.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {juniorPillars.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="mt-0.5 text-slate-800" />
                  {item}
                </div>
              ))}
            </div>
          </article>

          <aside className="bg-white border border-slate-200 overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/juniors/j1.jpg"
                alt="Florida Badgers Juniors training"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="p-5 border-t border-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Progress</p>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Juniors Photos</p>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">Square Gallery</h2>
            </div>
            <Link
              href="/academy/about"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-800 hover:text-black"
            >
              About Club <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {juniorOnlyGallery.map((src, index) => (
              <div key={src} className="group relative aspect-square overflow-hidden border border-slate-200 bg-white">
                <Image
                  src={src}
                  alt={`Florida Badgers Juniors ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-14">
        <div className="max-w-[1320px] mx-auto grid xl:grid-cols-[1fr_1fr] gap-6">
          <div className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">Age Categories</p>
            <div className="grid md:grid-cols-2 gap-4">
              {ageGroups.map((group) => (
                <article key={group.label} className="border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{group.label}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{group.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">Weekly Cycle</p>
            <div className="space-y-3">
              {weeklyFlow.map((item) => (
                <article key={item.title} className="border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
