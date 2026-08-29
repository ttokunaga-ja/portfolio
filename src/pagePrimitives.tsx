import React from "react";
import { Box, Card, Container, Stack, Typography } from "@mui/material";
import { LocaleContext } from "./localeContext";
import type { Locale } from "./types";

export function usePageLocale(): Locale {
  return React.useContext(LocaleContext);
}

export function formatTimestamp(value: string, locale: Locale) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(parsed);
}

export function formatArticleDate(value: string, locale: Locale) {
  if (!value) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    parsed
  );
}

export function Section({
  title,
  lead,
  children,
  tone = "default",
  align = "left"
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
  tone?: "default" | "paper";
  align?: "left" | "center";
}) {
  return (
    <Box
      component="section"
      sx={{
        py: { xs: 6, md: 8 },
        backgroundColor: tone === "paper" ? "background.paper" : "background.default",
        textAlign: align
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ maxWidth: 820, mb: 4, mx: align === "center" ? "auto" : 0, textAlign: align }}>
          <Typography variant="h2">{title}</Typography>
          {lead && (
            <Typography color="text.secondary" sx={{ mt: 1.3, fontSize: "1.05rem" }}>
              {lead}
            </Typography>
          )}
        </Box>
        {children}
      </Container>
    </Box>
  );
}

export function PageHead({
  icon,
  title,
  lead,
  align = "left"
}: {
  icon: React.ReactNode;
  title: string;
  lead: string;
  align?: "left" | "center";
}) {
  return (
    <Box sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <Stack
          spacing={2.2}
          sx={{
            maxWidth: 840,
            mx: align === "center" ? "auto" : 0,
            alignItems: align === "center" ? "center" : "flex-start",
            textAlign: align
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              display: "grid",
              placeItems: "center",
              borderRadius: 1.5,
              backgroundColor: "primary.main",
              color: "primary.contrastText"
            }}
          >
            {icon}
          </Box>
          <Typography variant="h1" sx={{ fontSize: "clamp(2.75rem, 7vw, 5rem)" }}>
            {title}
          </Typography>
          <Typography variant="h3" component="p" color="text.secondary" sx={{ fontWeight: 520 }}>
            {lead}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card variant="outlined">
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">{message}</Typography>
      </Box>
    </Card>
  );
}
