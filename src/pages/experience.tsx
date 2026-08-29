import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import { Box, Button, Card, CardActionArea, Chip, Container, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getEntries } from "../content";
import { EmptyState, PageHead, Section, usePageLocale } from "../pagePrimitives";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";
import type { ExperienceType, Locale, PortfolioEntry } from "../types";

const experienceDotColors: Record<ExperienceType, [string, string]> = {
  education: ["#1D4ED8", "#60A5FA"],
  work: ["#0E6F6A", "#37B37E"],
  community: ["#7C3AED", "#A78BFA"]
};

function getExperienceType(entry: PortfolioEntry): ExperienceType {
  if (entry.experienceType === "education" || entry.experienceType === "work" || entry.experienceType === "community") {
    return entry.experienceType;
  }

  if (
    entry.tags.some((tag) => /community|club|circle|student organization|robotics|lab|部活|部|団体|研究室/i.test(tag))
  ) {
    return "community";
  }

  return entry.tags.some((tag) => /university|college|school|academic|education/i.test(tag)) ? "education" : "work";
}

function getExperienceDotColor(type: ExperienceType, index: number) {
  const colors = experienceDotColors[type];
  return colors[index % colors.length];
}

function ExperiencePage({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const entries = getEntries(locale, "experience");

  return (
    <>
      <PageHead icon={<TimelineRoundedIcon />} title={t("page.experienceTitle")} lead={t("page.experienceLead")} />
      <Section title={t("page.experienceTitle")}>
        <ExperienceTimeline entries={entries} />
      </Section>
    </>
  );
}

function ExperienceTimeline({ entries }: { entries: PortfolioEntry[] }) {
  const locale = usePageLocale();
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState message={t("label.noContent")} />;
  }

  const typeCounts: Record<ExperienceType, number> = {
    education: 0,
    work: 0,
    community: 0
  };

  return (
    <Box sx={{ maxWidth: 980 }}>
      {entries.map((entry, index) => {
        const experienceType = getExperienceType(entry);
        const dotColor = getExperienceDotColor(experienceType, typeCounts[experienceType]);
        typeCounts[experienceType] += 1;

        return (
          <Box
            key={entry.slug}
            sx={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: { xs: "72px 28px minmax(0, 1fr)", md: "112px 36px minmax(0, 1fr)" },
              columnGap: { xs: 1.5, md: 2.5 }
            }}
          >
            <Stack
              spacing={0.2}
              sx={{
                alignItems: "flex-end",
                pt: 0.4,
                color: "text.secondary",
                textAlign: "right"
              }}
            >
              <Typography fontWeight={800} sx={{ fontSize: { xs: "0.72rem", md: "0.84rem" } }}>
                {entry.endLabel || entry.endDate || t("label.present")}
              </Typography>
              <Typography aria-hidden="true" sx={{ lineHeight: 1 }}>
                -
              </Typography>
              <Typography fontWeight={800} sx={{ fontSize: { xs: "0.72rem", md: "0.84rem" } }}>
                {entry.startLabel || entry.startDate || entry.period || "-"}
              </Typography>
            </Stack>
            <Box
              aria-hidden="true"
              sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center"
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: index === entries.length - 1 ? "calc(100% - 28px)" : 0,
                  width: 2,
                  backgroundColor: "divider"
                }}
              />
              <Box
                sx={{
                  position: "relative",
                  zIndex: 1,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "3px solid",
                  borderColor: "background.default",
                  backgroundColor: dotColor,
                  mt: 0.6
                }}
              />
            </Box>
            <Card variant="outlined" sx={{ mb: 2.5 }}>
              <CardActionArea href={hrefFor({ collection: "experience", slug: entry.slug }, locale)}>
                <Box sx={{ p: { xs: 2.2, md: 3 } }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                    <Box>
                      <Typography variant="h3">{entry.title}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {entry.role || entry.subtitle}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    {entry.abstract}
                  </Typography>
                  <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                    {entry.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                  <Button component="span" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 1.5, px: 0 }}>
                    {t("action.readMore")}
                  </Button>
                </Box>
              </CardActionArea>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
}

export default function ExperienceRoute({ route, locale, entryDetail }: RoutePageProps) {
  return <ExperiencePage locale={locale} />;
}
