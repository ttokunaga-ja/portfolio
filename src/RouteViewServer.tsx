import React from "react";
import AboutRoute from "./pages/about";
import ContactRoute from "./pages/contact";
import DetailRoute from "./pages/detail";
import ExperienceRoute from "./pages/experience";
import HomeRoute from "./pages/home";
import ListingRoute from "./pages/listing";
import PrivacyRoute from "./pages/privacy";
import SkillsRoute from "./pages/skills";
import type { RoutePageProps } from "./routePageTypes";

export default function RouteViewServer(props: RoutePageProps) {
  const { route } = props;
  if (route.kind === "detail" || route.kind === "notFound") return <DetailRoute {...props} />;
  switch (route.page) {
    case "about":
      return <AboutRoute {...props} />;
    case "research":
    case "projects":
    case "blog":
      return <ListingRoute {...props} />;
    case "experience":
      return <ExperienceRoute {...props} />;
    case "skills":
      return <SkillsRoute {...props} />;
    case "contact":
      return <ContactRoute {...props} />;
    case "privacy":
      return <PrivacyRoute {...props} />;
    case "home":
    default:
      return <HomeRoute {...props} />;
  }
}
