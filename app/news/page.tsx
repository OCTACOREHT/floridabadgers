import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { TrackedNewsLink } from "@/components/TrackedNewsLink";
import { getPublishedNewsArticles } from "@/lib/news.server";

export const metadata: Metadata = {
  title: "News | Florida Badgers FCA",
  description: "Latest news from Florida Badgers FCA: first team, academy, and club updates.",
};

export const revalidate = 60; // Refresh cached page every 60 seconds

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500 mb-3">
      {children}
    </span>
  );
}

export default async function NewsPage() {
  const allNews = await getPublishedNewsArticles();
  const featuredNews = allNews[0];
  const topNews = allNews.slice(1, 3);

  return (
    <main className="">
      <section className="bg-slate-900 px-6 xl:px-10 pt-32 pb-20 border-b border-white/10">
        <div className="max-w-[1320px] mx-auto">
          <SectionLabel>News</SectionLabel>
          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black uppercase tracking-tight text-white leading-[1.02]">
            The Latest News
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl leading-relaxed">
            Follow Florida Badgers FCA updates across the first team, academy, and club development.
          </p>
        </div>
      </section>

      {allNews.length > 0 ? (
        <>
          <section className="bg-slate-100 px-6 xl:px-10 py-10">
            <div className="max-w-[1320px] mx-auto grid xl:grid-cols-2 gap-6">
              <div className="grid gap-6">
                {topNews.map((article) => (
                  <TrackedNewsLink
                    id={article.id}
                    key={article.id}
                    href={`/news/article/${article.id}`}
                    articleId={article.id}
                    className="group grid sm:grid-cols-[220px_1fr] overflow-hidden bg-white border border-slate-200 transition hover:border-slate-400"
                  >
                    <div className="relative h-56 sm:h-full">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        unoptimized={article.image.startsWith("data:")}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-6 flex flex-col h-full">
                      <p className="text-slate-500 text-sm font-semibold">{article.date}</p>
                      <h2 className="mt-2 text-3xl sm:text-[34px] leading-[1.06] font-black uppercase tracking-tight text-slate-800">
                        {article.title}
                      </h2>
                      <p className="mt-4 text-slate-600 leading-relaxed mb-6">{article.excerpt}</p>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-[#1e3a5f] font-bold text-xs uppercase tracking-wider group-hover:gap-3 transition-all">
                        Read Article <ArrowRight size={14} />
                      </div>
                    </div>
                  </TrackedNewsLink>
                ))}
              </div>

              {featuredNews && (
                <TrackedNewsLink
                  id={featuredNews.id}
                  href={`/news/article/${featuredNews.id}`}
                  articleId={featuredNews.id}
                  className="group overflow-hidden bg-white border border-slate-200 transition hover:border-slate-400"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={featuredNews.image}
                      alt={featuredNews.title}
                      fill
                      unoptimized={featuredNews.image.startsWith("data:")}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6 flex flex-col h-full">
                    <p className="text-slate-500 text-sm font-semibold">{featuredNews.date}</p>
                    <h2 className="mt-2 text-4xl sm:text-[48px] leading-[1.04] font-black uppercase tracking-tight text-slate-800">
                      {featuredNews.title}
                    </h2>
                    <p className="mt-4 text-slate-600 leading-relaxed mb-6">{featuredNews.excerpt}</p>
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2 text-[#1e3a5f] font-bold text-xs uppercase tracking-wider group-hover:gap-3 transition-all">
                      Read Article <ArrowRight size={14} />
                    </div>
                  </div>
                </TrackedNewsLink>
              )}
            </div>
          </section>

          <section className="bg-white px-6 xl:px-10 py-16 border-t border-slate-200">
            <div className="max-w-[1320px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <SectionLabel>All Stories</SectionLabel>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
                    Club Updates
                  </h2>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-7 py-3.5 hover:bg-[#374151] transition-all"
                >
                  Back Home <ArrowRight size={15} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allNews.map((article) => (
                  <TrackedNewsLink
                    key={`card-${article.id}`}
                    href={`/news/article/${article.id}`}
                    articleId={article.id}
                    className="group bg-slate-50 border border-slate-200 p-5 transition hover:border-slate-400"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wider mb-3">
                      <span className="text-slate-700 font-semibold">{article.category}</span>
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {article.date}
                      </span>
                    </div>
                    <h3 className="text-2xl leading-[1.08] font-black uppercase tracking-tight text-slate-800">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-slate-600 leading-relaxed mb-4">{article.excerpt}</p>
                    <div className="mt-auto pt-4 border-t border-slate-200 flex items-center gap-2 text-[#1e3a5f] font-bold text-xs uppercase tracking-wider group-hover:gap-3 transition-all">
                      Read Article <ArrowRight size={14} />
                    </div>
                  </TrackedNewsLink>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="bg-white px-6 xl:px-10 py-20">
          <div className="max-w-[1320px] mx-auto text-center py-20 bg-slate-50 border border-dashed border-slate-300">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-400">
              No news articles found
            </h2>
            <p className="mt-2 text-slate-500">Check back later for club updates and announcements.</p>
            <div className="mt-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-7 py-3.5 hover:bg-[#374151] transition-all"
              >
                Back Home <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
