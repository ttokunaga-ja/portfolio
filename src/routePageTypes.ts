import type { Locale, PortfolioEntryDetail, RouteState } from "./types";

export type RoutePageProps = {
  route: RouteState;
  locale: Locale;
  entryDetail?: PortfolioEntryDetail;
};
