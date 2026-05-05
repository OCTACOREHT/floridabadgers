import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { academyMedia } from "@/lib/academyMedia";

const managementTeam = [
  { name: "Samson Louis Jean", role: "President" },
  { name: "Kirste-Ally", role: "General Manager" },
  { name: "Bri", role: "Manager Assistant, Finance" },
  { name: "Geneus", role: "Social Media Specialist" },
  { name: "Jeffly", role: "Administrator" },
  { name: "Charlemagne", role: "Logistics Manager" },
  { name: "Wewe", role: "Logistics Assistant" },
  { name: "Mau", role: "Logistics Assistant" },
  { name: "Daphcar", role: "Fan Club Manager" },
  { name: "Kerdelise", role: "Fan Club Assistant" },
];

const timeline = [
  {
    year: "2018",
    title: "Project Launch",
    text: "Samson (Samy) brought together young players from the street and introduced a structured football environment.",
  },
  {
    year: "Sharks FC",
    title: "First Identity",
    text: "The group developed under the Sharks FC name with regular and collective training foundations.",
  },
  {
    year: "Florida Badgers",
    title: "New Phase",
    text: "The club became Florida Badgers with a long-term vision for player development and competition.",
  },
];

const clubPillars = [
  "Develop disciplined and responsible players",
  "Build a healthy and competitive environment",
  "Strengthen the club-family-community relationship",
  "Create a consistent playing identity from junior to senior level",
];

export default function AcademyAboutPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="relative overflow-hidden bg-slate-900 text-white px-6 xl:px-10 py-16">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 14% 26%, #1e3a5f 0, transparent 36%), radial-gradient(circle at 84% 70%, #ffffff 0, transparent 22%)",
          }}
        />
        <div className="relative max-w-[1320px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70 mb-3">Academy / About Club</p>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.04]">
            Florida Badgers FC
          </h1>
          <p className="mt-4 text-white/75 max-w-3xl leading-relaxed">
            A football league club built on a strong human project: guiding youth, structuring development, and building a performance culture.
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
        <div className="max-w-[1320px] mx-auto grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <article className="bg-white border border-slate-200 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Founded in 2018</p>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-4">Our Story</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Founded in 2018, our journey began under the name Sharks FC, when Samson (known as Samy) saw a group of kids playing soccer on the side of the road and invited them to play in a more structured way.
            </p>
            <p className="text-slate-700 leading-relaxed mb-5">
              What started as a small group of passionate youths has now become a deeply rooted and meaningful club, now known as Florida Badgers.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {clubPillars.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="mt-0.5 text-slate-800" />
                  {item}
                </div>
              ))}
            </div>
          </article>

          <aside className="bg-white border border-slate-200 overflow-hidden">
            <div className="relative aspect-square sm:aspect-[4/3] xl:aspect-square">
              <Image
                src={academyMedia.aboutStory}
                alt="Florida Badgers FC history"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="p-5 border-t border-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Identity</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                The club emphasizes work ethic, tactical consistency, and player progression within a collective environment.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-12">
        <div className="max-w-[1320px] mx-auto bg-white border border-slate-200 p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-5">Club Timeline</p>
          <div className="grid md:grid-cols-3 gap-4">
            {timeline.map((item) => (
              <article key={item.title} className="border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{item.year}</p>
                <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 xl:px-10 pb-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Administration</p>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 mt-2">Management Team</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {managementTeam.map((member, index) => (
              <article key={member.name} className="bg-white border border-slate-200 overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={academyMedia.managementPhotos[index % academyMedia.managementPhotos.length]}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  />
                </div>
                <div className="p-3 border-t border-slate-200">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 leading-tight">{member.name}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{member.role}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/academy/juniors"
              className="inline-flex items-center gap-2 bg-[#1e3a5f] px-5 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#374151] transition-colors"
            >
              View Juniors <ArrowRight size={15} />
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 border border-slate-300 px-5 py-3 text-sm font-bold uppercase tracking-wider text-slate-900 hover:border-slate-500 transition-colors"
            >
              Contact Club
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

