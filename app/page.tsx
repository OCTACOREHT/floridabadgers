import HomeContent from "./HomeContent";
import { getActiveHeroSlides } from "@/lib/hero-slides.server";
import { getPublishedNewsArticles } from "@/lib/news.server";
// We don't have a server utility for fixtures yet, but we can add one or keep it client-side.
// However, to be fast, we should probably fetch it here.

export default async function Home() {
  // Fetch everything in parallel on the server
  const [initialSlides, initialNews] = await Promise.all([
    getActiveHeroSlides(),
    getPublishedNewsArticles(3),
  ]);

  return (
    <HomeContent 
      initialSlides={initialSlides} 
      initialNews={initialNews} 
    />
  );
}
