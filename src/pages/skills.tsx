import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, PageHead, Section, usePageLocale } from "../pagePrimitives";
import type { RoutePageProps } from "../routePageTypes";

const skillGroups: Array<{ title: string; items: string[] }> = [
  {
    title: "Frontend / UX",
    items: ["React", "TypeScript", "Vite", "MUI", "i18next", "Accessibility", "Responsive UI"]
  },
  {
    title: "Backend / API",
    items: ["Go", "Node.js", "Cloud Run", "Cloudflare Workers", "OpenAPI", "Firebase Auth", "API keys"]
  },
  {
    title: "Data / Search",
    items: ["PostgreSQL", "Neon", "CSV pipelines", "Autocomplete", "Education data", "Normalization"]
  },
  {
    title: "Document / Media",
    items: ["PDF", "pdf.js", "Local-first processing", "QR code generation", "Three.js", "Canvas"]
  },
  {
    title: "Operations",
    items: ["Cloudflare Pages", "GitHub Actions", "Security headers", "CSP", "Lighthouse", "Playwright"]
  },
  {
    title: "Research interests",
    items: ["AI in education", "Human-in-the-loop tools", "Privacy boundary design", "Reproducible datasets"]
  }
];

function SkillsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHead icon={<CodeRoundedIcon />} title={t("page.skillsTitle")} lead={t("page.skillsLead")} />
      <Section title={t("page.skillsTitle")} lead={t("page.skillsLead")}>
        {skillGroups.length === 0 ? (
          <EmptyState message={t("label.noContent")} />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
              gap: 2.5
            }}
          >
            {skillGroups.map((group) => (
              <Card key={group.title} variant="outlined">
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h3">{group.title}</Typography>
                  <Stack direction="row" spacing={0.9} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
                    {group.items.map((item) => (
                      <Chip key={item} label={item} variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Section>
    </>
  );
}

export default function SkillsRoute({ route, locale, entryDetail }: RoutePageProps) {
  return <SkillsPage />;
}
