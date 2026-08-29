import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import { Box, Button, Card, Container, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getLatestEntry } from "../content";
import { hrefFor } from "../routeLinks";
import { Section, usePageLocale } from "../pagePrimitives";
import type { RoutePageProps } from "../routePageTypes";
import type { Collection, Locale, PortfolioEntry } from "../types";

function HomePage({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const sections: Array<{
    collection: Collection;
    title: string;
    lead: string;
    href: string;
    icon: React.ReactNode;
  }> = [
    {
      collection: "research",
      title: t("page.researchTitle"),
      lead: t("page.researchLead"),
      href: hrefFor("research", locale),
      icon: <ScienceRoundedIcon />
    },
    {
      collection: "projects",
      title: t("page.projectsTitle"),
      lead: t("page.projectsLead"),
      href: hrefFor("projects", locale),
      icon: <AccountTreeRoundedIcon />
    },
    {
      collection: "experience",
      title: t("page.experienceTitle"),
      lead: t("page.experienceLead"),
      href: hrefFor("experience", locale),
      icon: <TimelineRoundedIcon />
    },
    {
      collection: "blog",
      title: t("page.blogTitle"),
      lead: t("page.blogLead"),
      href: hrefFor("blog", locale),
      icon: <ArticleRoundedIcon />
    }
  ];

  return (
    <>
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper"
        }}
      >
        <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
          <Stack spacing={2.4} sx={{ maxWidth: 860 }}>
            <Box>
              <Typography variant="h1">{t("home.title")}</Typography>
              <Typography variant="h3" component="p" color="text.secondary" sx={{ mt: 2, fontWeight: 520 }}>
                {t("home.lead")}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Section title={t("home.contentTitle")}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
            gap: 2.5
          }}
        >
          {sections.map((section) => (
            <HomeContentCard
              key={section.collection}
              title={section.title}
              lead={section.lead}
              href={section.href}
              icon={section.icon}
              latest={getLatestEntry(locale, section.collection)}
            />
          ))}
        </Box>
      </Section>
    </>
  );
}

function HomeContentCard({
  title,
  lead,
  href,
  icon,
  latest
}: {
  title: string;
  lead: string;
  href: string;
  icon: React.ReactNode;
  latest?: PortfolioEntry;
}) {
  const { t } = useTranslation();
  const locale = usePageLocale();

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <Stack spacing={2.2} sx={{ p: 2.5, height: "100%" }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>{icon}</Box>
          <Typography variant="h3">{title}</Typography>
        </Stack>
        <Typography color="text.secondary">{lead}</Typography>
        <Box sx={{ flex: 1 }}>
          <Typography variant="overline" color="primary" fontWeight={800}>
            {t("label.latest")}
          </Typography>
          {latest ? (
            <Box sx={{ mt: 0.7 }}>
              <Typography fontWeight={800}>{latest.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {latest.abstract}
              </Typography>
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 0.7 }}>
              {t("label.noContent")}
            </Typography>
          )}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            href={latest ? hrefFor({ collection: latest.collection, slug: latest.slug }, locale) : href}
            variant={latest ? "contained" : "outlined"}
            endIcon={<ArrowForwardRoundedIcon />}
          >
            {latest ? t("action.viewLatest") : t("action.viewIndex")}
          </Button>
          {latest && (
            <Button href={href} variant="text">
              {t("action.viewIndex")}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

export default function HomeRoute({ route, locale, entryDetail }: RoutePageProps) {
  return <HomePage locale={locale} />;
}
