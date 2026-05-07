import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { getUpslFixturesBySeason } from "@/lib/upsl";

export const metadata: Metadata = {
  title: "UPSL Match Schedule | Florida Badgers FCA",
  description: "Florida Badgers FCA UPSL fixtures for the 2026 season with team logos and match details.",
};

const SEASON_YEAR = 2026;
const BADGERS_FALLBACK_LOGO = "/images/Florida Badgers.png";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 mb-3">
      {children}
    </span>
  );
}

function formatKickoff(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async function SchedulePage() {
  const { fixtures, error } = await getUpslFixturesBySeason(SEASON_YEAR);

  return (
    <main className="">
      <section className="bg-slate-900 text-white px-6 xl:px-10 pt-32 pb-20 border-b border-white/10">
        <div className="max-w-[1320px] mx-auto">
          <SectionLabel>UPSL {SEASON_YEAR}</SectionLabel>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[1.02]">
            Florida Badgers Match Schedule
          </h1>
          <p className="mt-5 text-white/70 max-w-3xl leading-relaxed">
            Live fixtures powered by API data for the Florida Badgers {SEASON_YEAR} season.
            Team logos, kickoff dates, venue and competition are updated automatically.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 xl:px-10 py-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <SectionLabel>Season Overview</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900">
                Fixtures {fixtures.length}
              </h2>
            </div>
          </div>

          {error ? (
            <article className="border border-amber-300 bg-amber-50 p-5 text-amber-900">
              <p className="font-bold uppercase tracking-wider text-xs mb-2">API Status</p>
              <p className="text-sm leading-relaxed">
                {error}
              </p>
              <p className="text-sm leading-relaxed mt-2">
                Set `SPORTMONKS_API_TOKEN` (and optionally `SPORTMONKS_BADGERS_TEAM_ID`) in your `.env.local`,
                then refresh this page.
              </p>
            </article>
          ) : null}

          {!fixtures.length ? (
            <article className="border border-slate-200 bg-slate-50 p-6 text-slate-700">
              <p className="font-bold uppercase tracking-wider text-xs mb-2">No Fixtures Found</p>
              <p className="text-sm leading-relaxed">
                No {SEASON_YEAR} fixtures were returned for Florida Badgers FC with the current API configuration.
              </p>
            </article>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fixtures.map((fixture) => (
                <article
                  key={fixture.id}
                  className="border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Image src="/images/UPSL.png" alt="UPSL" width={14} height={14} className="object-contain" />
                      {fixture.competition}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest bg-slate-100 text-slate-700 px-2 py-1">
                      {fixture.status ?? "Scheduled"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border border-slate-200 bg-white overflow-hidden flex-shrink-0">
                        <Image
                          src={fixture.home.logoUrl || BADGERS_FALLBACK_LOGO}
                          alt={`${fixture.home.name} logo`}
                          fill
                          sizes="(min-width: 1024px) 64px, (min-width: 768px) 56px, 44px"
                          quality={100}
                          className="object-contain p-0.5 md:p-1"
                        />
                      </div>
                      <p className="font-black text-sm md:text-[15px] text-slate-900 leading-tight">{fixture.home.name}</p>
                    </div>

                    <div className="text-slate-400 font-black text-sm uppercase tracking-widest">vs</div>

                    <div className="flex items-center gap-3 min-w-0 justify-end text-right">
                      <p className="font-black text-sm md:text-[15px] text-slate-900 leading-tight">{fixture.away.name}</p>
                      <div className="relative w-11 h-11 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border border-slate-200 bg-white overflow-hidden flex-shrink-0">
                        <Image
                          src={fixture.away.logoUrl || BADGERS_FALLBACK_LOGO}
                          alt={`${fixture.away.name} logo`}
                          fill
                          sizes="(min-width: 1024px) 64px, (min-width: 768px) 56px, 44px"
                          quality={100}
                          className="object-contain p-0.5 md:p-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                    <div className="inline-flex items-center gap-1.5">
                      <Calendar size={14} />
                      <time dateTime={fixture.kickoff}>{formatKickoff(fixture.kickoff)}</time>
                    </div>
                    <div className="inline-flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span>{fixture.venue ?? "TBD"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-900 py-14 px-6 xl:px-10 border-t border-white/10">
        <div className="max-w-[1320px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <SectionLabel>Need Updates?</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Sync New Fixtures Anytime
            </h2>
            <p className="text-white/60 mt-2 max-w-2xl">
              You can refresh the schedule as soon as new UPSL fixtures are published in the API.
            </p>
          </div>
          <Link
            href="/first-team"
            className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-7 py-3.5 hover:bg-[#374151] transition-colors"
          >
            First Team <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
