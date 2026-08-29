import type React from "react";
import type { RoutePageProps } from "./routePageTypes";
import type { RouteState } from "./types";

type RoutePage = React.ComponentType<RoutePageProps>;

export async function loadRoutePage(route: RouteState): Promise<RoutePage> {
  if (route.kind === "detail" || route.kind === "notFound") return (await import("./pages/detail")).default;

  switch (route.page) {
    case "about":
      return (await import("./pages/about")).default;
    case "research":
    case "projects":
    case "blog":
      return (await import("./pages/listing")).default;
    case "experience":
      return (await import("./pages/experience")).default;
    case "skills":
      return (await import("./pages/skills")).default;
    case "contact":
      return (await import("./pages/contact")).default;
    case "privacy":
      return (await import("./pages/privacy")).default;
    case "home":
    default:
      return (await import("./pages/home")).default;
  }
}
