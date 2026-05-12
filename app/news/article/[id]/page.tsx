import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { Suspense } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { notFound } from "next/navigation";

import { TrackedNewsLink } from "@/components/TrackedNewsLink";
import { ArticleShare } from "@/components/news/article-share";
import { ArticleViewTracker } from "@/components/news/article-view-tracker";
import { getPublishedNewsArticleById, getPublishedNewsArticles } from "@/lib/news.server";

export const revalidate = 60;

type Params = Promise<{ id: string }>;

const getCachedArticleById = cache(async (id: string) => getPublishedNewsArticleById(id));

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getCachedArticleById(id);

  if (!article) {
    return {
      title: "Article | Florida Badgers FCA",
      description: "News article from Florida Badgers FCA.",
    };
  }

  return {
    title: `${article.title} | Florida Badgers FCA`,
    description: article.excerpt,
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const article = await getCachedArticleById(id);

  if (!article) {
    notFound();
  }

  const articlePath = `/news/article/${article.id}`;

  return (
    <main className="bg-slate-100">
      <ArticleViewTracker articleId={article.id} path={articlePath} />

      <section className="bg-slate-900 px-6 xl:px-10 pt-32 pb-14 border-b border-white/10">
        <div className="max-w-[1100px] mx-auto">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to News
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-white/60">
            {article.category}
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl xl:text-5xl font-black uppercase tracking-tight text-white leading-[1.06]">
            {article.title}
          </h1>
          <p className="mt-4 inline-flex items-center gap-2 text-white/70">
            <Calendar className="size-4" />
            {article.date}
          </p>
        </div>
      </section>

      <section className="px-6 xl:px-10 py-10">
        <article className="max-w-[1100px] mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative aspect-[16/8] w-full bg-slate-200">
            <Image
              src={article.image}
              alt={article.title}
              fill
              unoptimized={article.image.startsWith("data:")}
              className="object-cover"
            />
          </div>

          <div className="p-6 lg:p-8">
            <div className="mx-auto max-w-[820px]">
              {article.subtitle ? (
                <p className="text-lg font-semibold text-slate-700">{article.subtitle}</p>
              ) : null}
              <div
                className="prose prose-slate mt-5 max-w-none whitespace-pre-wrap leading-relaxed [&_a]:font-semibold [&_a]:text-[#1e3a5f] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_li]:whitespace-pre-wrap [&_p]:whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
              />
              <ArticleShare title={article.title} path={articlePath} />
            </div>
          </div>
        </article>
      </section>

      <section className="px-6 xl:px-10 pb-14">
        <div className="max-w-[1100px] mx-auto">
          <Suspense fallback={<RelatedArticlesSkeleton />}>
            <RelatedArticles articleId={article.id} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function RelatedArticles({ articleId }: { articleId: string }) {
  const relatedArticles = (await getPublishedNewsArticles(8))
    .filter((entry) => entry.id !== articleId)
    .slice(0, 3);

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
        Other Articles
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatedArticles.map((entry) => (
          <TrackedNewsLink
            key={entry.id}
            href={`/news/article/${entry.id}`}
            articleId={entry.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-400"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={entry.image}
                alt={entry.title}
                fill
                unoptimized={entry.image.startsWith("data:")}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-500">{entry.date}</p>
              <h3 className="mt-2 text-lg font-black uppercase leading-tight tracking-tight text-slate-900">
                {entry.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{entry.excerpt}</p>
            </div>
          </TrackedNewsLink>
        ))}
      </div>
    </>
  );
}

function RelatedArticlesSkeleton() {
  return (
    <>
      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
        Other Articles
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="aspect-[16/10] animate-pulse bg-slate-200" />
            <div className="p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-3 h-5 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
