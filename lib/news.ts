export type NewsArticle = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: "Club" | "Academy" | "First Team";
  image: string;
};
