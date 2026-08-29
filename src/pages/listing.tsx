import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Box, Button, Card, CardActionArea, Chip, Container, Link, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getDemoHref, getEntries } from "../content";
import { EmptyState, PageHead, Section, formatArticleDate, formatTimestamp, usePageLocale } from "../pagePrimitives";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";
import type { Collection, Locale, PortfolioEntry } from "../types";

function ListingPage({ locale, collection }: { locale: Locale; collection: Collection }) {
  const { t } = useTranslation();
  const entries = getEntries(locale, collection);

  if (collection === "research" || collection === "blog") {
    return <ArticleListingPage locale={locale} collection={collection} entries={entries} />;
  }

  const title = t("page.projectsTitle");
  const lead = t("page.projectsLead");

  return (
    <>
      <PageHead icon={<AccountTreeRoundedIcon />} title={title} lead={lead} />
      <Section title={title} lead={t("label.abstract")}>
        <EntryGrid entries={entries} />
      </Section>
    </>
  );
}

function ArticleListingPage({
  locale,
  collection,
  entries
}: {
  locale: Locale;
  collection: "research" | "blog";
  entries: PortfolioEntry[];
}) {
  const { t } = useTranslation();
  const title = collection === "research" ? t("page.researchTitle") : t("page.blogTitle");
  const lead = collection === "research" ? t("page.researchLead") : t("page.blogLead");
  const collectionLabel = collection === "research" ? t("nav.research") : t("nav.blog");

  return (
    <>
      <Box
        component="header"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper"
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
          <Stack spacing={1.5} sx={{ maxWidth: 800 }}>
            <Typography variant="overline" color="primary" fontWeight={800} letterSpacing="0.12em">
              {collectionLabel}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: "clamp(2.7rem, 6vw, 4.5rem)", lineHeight: 1 }}>
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: "1rem", md: "1.12rem" }, lineHeight: 1.75 }}>
              {lead}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container component="section" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <ArticleEntryList entries={entries} />
      </Container>
    </>
  );
}

function ArticleEntryList({ entries }: { entries: PortfolioEntry[] }) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState message={t("label.noContent")} />;
  }

  return (
    <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, borderTop: "1px solid", borderColor: "divider" }}>
      {entries.map((entry) => (
        <ArticleListItem key={`${entry.collection}-${entry.slug}`} entry={entry} />
      ))}
    </Box>
  );
}

function ArticleListItem({ entry }: { entry: PortfolioEntry }) {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const collectionLabel = entry.collection === "research" ? t("nav.research") : t("nav.blog");
  const metadata = entry.publishedAt
    ? `${t("label.published")} · ${formatArticleDate(entry.publishedAt, locale)}`
    : entry.period
      ? `${t("label.period")} · ${entry.period}`
      : entry.updatedAt
        ? `${t("label.updated")} · ${formatArticleDate(entry.updatedAt, locale)}`
        : "";

  return (
    <Box component="li" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) auto" },
          gap: { xs: 2.25, md: 3 },
          py: { xs: 3, md: 4 },
          alignItems: "start"
        }}
      >
        <Stack spacing={1.35} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.1} useFlexGap flexWrap="wrap" alignItems="center">
            <Typography variant="overline" color="primary" fontWeight={800} letterSpacing="0.08em">
              {collectionLabel}
            </Typography>
            {metadata && (
              <Typography variant="body2" color="text.secondary">
                {metadata}
              </Typography>
            )}
          </Stack>

          <Link
            href={hrefFor({ collection: entry.collection, slug: entry.slug }, locale)}
            underline="none"
            color="text.primary"
            sx={{
              width: "fit-content",
              maxWidth: "100%",
              "&:hover": { color: "primary.main" },
              "&:focus-visible": { borderRadius: 0.5 }
            }}
          >
            <Typography component="h2" variant="h2" sx={{ fontSize: "clamp(1.45rem, 2.8vw, 2rem)", lineHeight: 1.28 }}>
              {entry.title}
            </Typography>
          </Link>

          {entry.subtitle && (
            <Typography color="text.secondary" sx={{ fontWeight: 650 }}>
              {entry.subtitle}
            </Typography>
          )}

          <Typography
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: { xs: 3, md: 2 },
              lineHeight: 1.75
            }}
          >
            {entry.abstract}
          </Typography>

          {entry.tags.length > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {entry.tags.slice(0, 5).map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
          )}
        </Stack>

        <Stack
          direction={{ xs: "row", md: "column" }}
          spacing={0.75}
          sx={{ alignItems: { xs: "flex-start", md: "flex-end" } }}
        >
          <Button
            href={hrefFor({ collection: entry.collection, slug: entry.slug }, locale)}
            variant="outlined"
            endIcon={<ArrowForwardRoundedIcon />}
            aria-label={`${entry.title}: ${t("action.readMore")}`}
          >
            {t("action.readMore")}
          </Button>
          {entry.canonicalUrl && (
            <Button
              href={entry.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              variant="text"
              endIcon={<OpenInNewRoundedIcon />}
              aria-label={`Zenn (${t("label.opensInNewTab")})`}
            >
              Zenn
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function EntryGrid({ entries }: { entries: PortfolioEntry[] }) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return <EmptyState message={t("label.noContent")} />;
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
        gap: 2.5
      }}
    >
      {entries.map((entry) => (
        <EntryCard key={`${entry.collection}-${entry.slug}`} entry={entry} />
      ))}
    </Box>
  );
}

function EntryCard({ entry }: { entry: PortfolioEntry }) {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const demoHref = entry.collection === "projects" ? getDemoHref(entry) : "";

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ p: 2.5, height: "100%" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="overline" color="primary" fontWeight={800}>
            {entry.collection}
          </Typography>
          {entry.publishedAt && (
            <Typography variant="overline" color="text.secondary">
              {entry.publishedAt}
            </Typography>
          )}
          {entry.updatedAt && (
            <Typography variant="overline" color="text.secondary">
              {formatTimestamp(entry.updatedAt, locale)}
            </Typography>
          )}
        </Stack>
        <Box>
          <Typography variant="h3">{entry.title}</Typography>
          {entry.subtitle && (
            <Typography color="text.secondary" sx={{ mt: 0.7 }}>
              {entry.subtitle}
            </Typography>
          )}
        </Box>
        <Typography color="text.secondary" sx={{ flex: 1 }}>
          {entry.abstract}
        </Typography>
        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
          {entry.tags.slice(0, 4).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {demoHref && (
            <Button
              href={demoHref}
              target="_blank"
              rel="noreferrer"
              variant="contained"
              endIcon={<OpenInNewRoundedIcon />}
              aria-label={`${t("action.openDemo")} (${t("label.opensInNewTab")})`}
            >
              {t("action.openDemo")}
            </Button>
          )}
          <Button
            href={hrefFor({ collection: entry.collection, slug: entry.slug }, locale)}
            endIcon={<ArrowForwardRoundedIcon />}
          >
            {t("action.readMore")}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

export default function ListingRoute({ route, locale, entryDetail }: RoutePageProps) {
  return (
    <ListingPage
      locale={locale}
      collection={
        route.kind === "page" && ["research", "projects", "blog"].includes(route.page)
          ? (route.page as Collection)
          : "research"
      }
    />
  );
}
