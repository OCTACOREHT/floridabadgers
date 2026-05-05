export type NewsArticle = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Club" | "Academy" | "First Team";
  image: string;
};

export const newsArticles: NewsArticle[] = [
  {
    id: "new-era-in-florida",
    title: "Florida Badgers - A New Era For Soccer In Florida",
    excerpt:
      "Florida Badgers FCA continues building a competitive identity with discipline, intensity, and a clear football vision.",
    date: "1 August 2025",
    category: "Club",
    image: "/images/IMG_6281.JPG.jpeg",
  },
  {
    id: "developing-champions-youth",
    title: "Developing Champions Inside The Florida Badgers Youth Program",
    excerpt:
      "Our academy structure helps players improve technical quality, confidence, and decision making week after week.",
    date: "1 August 2025",
    category: "Academy",
    image: "/images/IMG_6201.JPG.jpeg",
  },
  {
    id: "welcome-passion-purpose",
    title: "Welcome To Florida Badgers FC: Where Passion Meets Purpose",
    excerpt:
      "The club keeps growing around committed players, families, and coaches focused on long term development.",
    date: "1 August 2025",
    category: "First Team",
    image: "/images/IMG_6342.JPG.jpeg",
  },
  {
    id: "first-team-preseason-focus",
    title: "First Team Preseason Focus: Fitness, Unity, Execution",
    excerpt:
      "The senior squad prepares for the next UPSL fixtures with an emphasis on organization and match intensity.",
    date: "3 August 2025",
    category: "First Team",
    image: "/images/WhatsApp Image 2026-05-03 at 11.49.59 PM.jpeg",
  },
  {
    id: "academy-mentality",
    title: "Academy Mentality: Building Competitive Habits Early",
    excerpt:
      "Training blocks this month prioritize movement quality, pressing triggers, and composure under pressure.",
    date: "5 August 2025",
    category: "Academy",
    image: "/images/WhatsApp Image 2026-05-03 at 11.50.02 PM.jpeg",
  },
  {
    id: "community-and-football",
    title: "Community And Football: Growing The Badgers Identity",
    excerpt:
      "From weekly sessions to matchdays, the club keeps strengthening local community ties through football.",
    date: "7 August 2025",
    category: "Club",
    image: "/images/WhatsApp Image 2026-05-03 at 11.39.44 PM.jpeg",
  },
];

