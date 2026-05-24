export type Locale = "ja" | "en";

export type Collection = "research" | "projects" | "experience";

export type PrimaryPage = "home" | "research" | "projects" | "experience" | "skills" | "contact";

export type ExperienceType = "education" | "work";

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
  organization: string;
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
  bodyHtml: string;
};

export type RouteState = { kind: "page"; page: PrimaryPage } | { kind: "detail"; collection: Collection; slug: string };
