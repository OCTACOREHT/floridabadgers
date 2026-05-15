import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Flag, ShieldCheck, Trophy, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Men's First Team | Florida Badgers FCA",
  description: "Discover the Florida Badgers FCA Men's First Team squad, staff, and upcoming fixtures.",
};

type Player = {
  number: number;
  name: string;
  position: string;
  age: number;
  country: string;
  role?: "Captain" | "Vice Captain";
};

const players: Player[] = [
  { number: 32, name: "Luvins Dorsainvil", position: "Goalkeeper", age: 24, country: "Haiti" },
  { number: 8, name: "Willdieffson Francois", position: "Right Back", age: 22, country: "Haiti" },
  { number: 13, name: "Stephen Jean", position: "Left Back", age: 21, country: "USA" },
  { number: 6, name: "Jonex Sirius", position: "Midfielder", age: 23, country: "Haiti", role: "Vice Captain" },
  { number: 2, name: "Woodmael Beauchamps", position: "Central Midfielder", age: 20, country: "USA" },
  { number: 10, name: "Carl Edens Joseph", position: "Attacking Midfielder", age: 25, country: "Haiti", role: "Captain" },
  { number: 11, name: "Altidort", position: "Winger", age: 22, country: "USA" },
  { number: 14, name: "John Nalus", position: "Forward", age: 24, country: "Jamaica" },
  { number: 7, name: "Schimiliquen Castin", position: "Forward", age: 23, country: "Haiti" },
  { number: 4, name: "Bens Deliska", position: "Defender", age: 21, country: "USA" },
  { number: 5, name: "Michel Andre", position: "Center Back", age: 26, country: "Haiti" },
  { number: 19, name: "Rony Pierre", position: "Midfielder", age: 20, country: "USA" },
];

const staff = [
  { name: "Samson (Samy)", role: "Head Coach" },
  { name: "Jeremie Louis", role: "Assistant Coach" },
  { name: "Kervens Robert", role: "Fitness Coach" },
  { name: "Daniel Noel", role: "Goalkeeper Coach" },
];

const fixtures = [
  { opponent: "City Soccer FC", date: "2026-05-18", competition: "UPSL - Florida South Zone II", venue: "Home" },
  { opponent: "Florida Soccer Soldiers", date: "2026-05-25", competition: "UPSL - Florida South Zone II", venue: "Away" },
  { opponent: "Palm Beach United", date: "2026-06-01", competition: "UPSL - Florida South Zone II", venue: "Home" },
  { opponent: "South Coast Academy", date: "2026-06-08", competition: "UPSL - Florida South Zone II", venue: "Away" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 mb-3">
      {children}
    </span>
  );
}

export default function FirstTeamPage() {
  return (
    <main className="">
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800/70" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1320px] mx-auto px-6 xl:px-10 pt-32 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionLabel>Men&apos;s First Team</SectionLabel>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.05]">
              Built To Compete
            </h1>
            <p className="mt-5 max-w-xl text-white/70 leading-relaxed">
              Meet the players and staff leading Florida Badgers FCA in UPSL competition.
              Disciplined football, high intensity, and a clear identity every matchday.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:bg-[#374151] transition-all"
              >
                Full Schedule <ArrowRight size={15} />
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 border border-white/25 text-white font-bold text-sm uppercase tracking-wider px-6 py-3.5 hover:border-white transition-all"
              >
                Join Tryouts
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Users size={18} />, label: "Squad Size", value: "24" },
              { icon: <Trophy size={18} />, label: "Competition", value: "UPSL" },
              { icon: <ShieldCheck size={18} />, label: "Founded", value: "2018" },
              { icon: <Flag size={18} />, label: "Home", value: "Boynton Beach" },
            ].map((item) => (
              <div key={item.label} className="bg-white/5 border border-white/15 p-4 backdrop-blur-[1px]">
                <div className="flex items-center gap-2 text-white/75 mb-2">{item.icon}<span className="text-xs uppercase tracking-wider">{item.label}</span></div>
                <div className="text-xl sm:text-2xl font-black">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-6 xl:px-10">
        <div className="max-w-[1320px] mx-auto">
          <SectionLabel>Team Roster</SectionLabel>
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">Current Squad</h2>
            <span className="text-sm text-slate-500">{players.length} listed players</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((player) => (
              <article
                key={`${player.number}-${player.name}`}
                className="bg-slate-50 border border-slate-200 p-4 hover:border-slate-400 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl font-black text-slate-300 leading-none">#{player.number}</div>
                  {player.role && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-slate-800 px-2 py-1">
                      {player.role}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-black text-black leading-tight">{player.name}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700">{player.position}</p>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs uppercase tracking-wider text-slate-500">
                  <span>Age {player.age}</span>
                  <span>{player.country}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-800 py-20 px-6 xl:px-10">
        <div className="max-w-[1320px] mx-auto">
          <SectionLabel>Technical Team</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-8">Coaching Staff</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {staff.map((member) => (
              <article key={member.name} className="bg-slate-900 border border-white/10 p-5">
                <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Staff</div>
                <h3 className="text-lg font-black text-white leading-tight">{member.name}</h3>
                <p className="text-sm text-white/70 mt-1">{member.role}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 px-6 xl:px-10 border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto">
          <SectionLabel>Matchday</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black mb-8">Upcoming Fixtures</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {fixtures.map((fixture) => (
              <article key={`${fixture.opponent}-${fixture.date}`} className="border border-slate-200 bg-white p-5 hover:border-slate-400 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">{fixture.competition}</p>
                    <h3 className="text-xl font-black text-black mt-1">Florida Badgers FCA vs {fixture.opponent}</h3>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest bg-slate-100 text-slate-700 px-2 py-1">
                    {fixture.venue}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-slate-600 text-sm">
                  <Calendar size={14} />
                  <time dateTime={fixture.date}>{fixture.date}</time>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 px-6 xl:px-10 border-t border-white/10">
        <div className="max-w-[1320px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <SectionLabel>Support The Team</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Back The First Team This Season
            </h2>
            <p className="text-white/60 mt-3 max-w-2xl">
              Follow every match, support the squad, and be part of the club growth.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-7 py-3.5 hover:bg-[#374151] transition-all"
            >
              Team Shop <ArrowRight size={16} />
            </Link>
            <div className="relative w-12 h-12 border border-slate-200 bg-white p-1">
              <Image src="/images/Florida Badgers.png" alt="Florida Badgers badge" fill className="object-contain p-1" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

