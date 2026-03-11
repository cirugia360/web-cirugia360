export type BlogImage = {
  url: string;
  alt: string;
};

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogListItem = {
  autoSeoId: number;
  title: string;
  slug: string;
  url: string;
  metaDescription: string;
  excerpt: string;
  heroImage: BlogImage | null;
  infographicImage: BlogImage | null;
  keywords: string[];
  metaKeywords: string | null;
  languageCode: string;
  status: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
};

export type BlogPost = BlogListItem & {
  contentHtml: string;
  contentMarkdown: string;
  faqSchema: BlogFaqItem[];
  createdAt: string;
  updatedOnSiteAt: string;
  createdOnSiteAt: string;
};
