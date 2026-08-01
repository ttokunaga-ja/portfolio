export type Locale = "ja" | "en";

export type Collection = "research" | "projects" | "experience" | "blog";

export type PrimaryPage =
  "home" | "about" | "research" | "projects" | "experience" | "blog" | "skills" | "contact" | "privacy";

export type ExperienceType = "education" | "work" | "community";

export type PortfolioLink = {
  label: string;
  url: string;
  kind: string;
};

export type PortfolioEntry = {
  locale: Locale;
  collection: Collection;
  slug: string;
  title: string;
  subtitle: string;
  abstract: string;
  role: string;
  period: string;
  startDate: string;
  endDate: string;
  startLabel: string;
  endLabel: string;
  demoUrl: string;
  experienceType: ExperienceType | "";
  sortOrder: number;
  featured: boolean;
  tags: string[];
  links: PortfolioLink[];
  publishedAt: string;
  updatedAt: string;
  canonicalUrl: string;
  bodyHtml: string;
};

export type RouteState = { kind: "page"; page: PrimaryPage } | { kind: "detail"; collection: Collection; slug: string };
