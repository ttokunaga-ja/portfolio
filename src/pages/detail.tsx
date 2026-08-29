import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Box, Button, Card, Chip, Container, Divider, Link, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getDemoHref, getEntry } from "../content";
import { Section, formatArticleDate, formatTimestamp } from "../pagePrimitives";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";
import type { Collection, Locale, PortfolioEntry, PortfolioEntryDetail } from "../types";

function NotFoundPage({ locale }: { locale: Locale }) {
  const isJapanese = locale === "ja";
  return (
    <Section
      title={isJapanese ? "ページが見つかりません" : "Page not found"}
      lead={
        isJapanese
          ? "お探しのコンテンツは存在しないか、移動しました。"
          : "The requested content does not exist or has moved."
      }
    >
      <Button href={hrefFor("home", locale)} variant="contained">
        {isJapanese ? "ホームへ戻る" : "Back home"}
      </Button>
    </Section>
  );
}

function ArticleDetailPage({
  locale,
  entry,
  detail
}: {
  locale: Locale;
  entry: PortfolioEntry;
  detail: PortfolioEntryDetail;
}) {
  const { t } = useTranslation();
  const collectionLabel = entry.collection === "research" ? t("nav.research") : t("nav.blog");
  const visibleLinks = entry.links.filter((link) => {
    return !["demo", "experience", "trial", "preview", "play"].includes(link.kind);
  });
  const canonicalIsZenn = /(^|\.)zenn\.dev$/i.test(
    (() => {
      try {
        return new URL(entry.canonicalUrl).hostname;
      } catch {
        return "";
      }
    })()
  );

  return (
    <>
      <Box
        component="header"
        sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
          <Stack spacing={2.15} sx={{ maxWidth: 1120 }}>
            <Typography variant="overline" color="primary" fontWeight={800} letterSpacing="0.12em">
              {collectionLabel}
            </Typography>
            <Typography component="h1" variant="h1" sx={{ fontSize: "clamp(2.25rem, 3vw, 3.25rem)", lineHeight: 1.22 }}>
              {entry.title}
            </Typography>
            {entry.subtitle && (
              <Typography
                component="p"
                color="text.secondary"
                sx={{ fontSize: { xs: "1.04rem", md: "1.25rem" }, lineHeight: 1.65 }}
              >
                {entry.subtitle}
              </Typography>
            )}
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              {entry.publishedAt && (
                <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("label.published")} · {formatArticleDate(entry.publishedAt, locale)}
                </Typography>
              )}
              {entry.updatedAt && (
                <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("label.updated")} · {formatArticleDate(entry.updatedAt, locale)}
                </Typography>
              )}
              {entry.period && (
                <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("label.period")} · {entry.period}
                </Typography>
              )}
            </Stack>
            {entry.tags.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={800} sx={{ mb: 1 }}>
                  {t("label.topics")}
                </Typography>
                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                  {entry.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              md: "minmax(0, 1fr) minmax(220px, 260px)",
              lg: "minmax(0, 760px) minmax(250px, 300px)"
            },
            justifyContent: "center",
            gap: { xs: 4, md: 4, lg: 7 },
            alignItems: "start"
          }}
        >
          <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
            <MarkdownArticle html={detail.bodyHtml} />
          </Box>

          <Box
            component="aside"
            aria-label={`${entry.title} ${t("label.contents")}`}
            sx={{
              order: { xs: 1, md: 2 },
              position: { md: "sticky" },
              top: { md: 96 },
              minWidth: 0
            }}
          >
            <Stack spacing={2.25}>
              {detail.toc.length > 0 && <ArticleTableOfContents toc={detail.toc} />}

              {(entry.canonicalUrl || visibleLinks.length > 0) && (
                <Card variant="outlined">
                  <Stack spacing={1.25} sx={{ p: 2.25 }}>
                    <Typography variant="h4" component="h2">
                      {t("label.links")}
                    </Typography>
                    {entry.canonicalUrl && (
                      <Button
                        href={entry.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        fullWidth
                        endIcon={<OpenInNewRoundedIcon />}
                        aria-label={`${canonicalIsZenn ? "Zenn" : t("label.source")} (${t("label.opensInNewTab")})`}
                      >
                        {canonicalIsZenn ? t("action.readOnZenn") : t("label.source")}
                      </Button>
                    )}
                    {visibleLinks.map((link) => (
                      <Button
                        key={`${link.label}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        variant="text"
                        endIcon={<OpenInNewRoundedIcon />}
                        aria-label={`${link.label} (${t("label.opensInNewTab")})`}
                        sx={{ justifyContent: "space-between" }}
                      >
                        {link.label}
                      </Button>
                    ))}
                  </Stack>
                </Card>
              )}
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  );
}

function ArticleTableOfContents({ toc }: { toc: PortfolioEntryDetail["toc"] }) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <Box component="nav" aria-label={t("label.contents")} sx={{ p: 2.25 }}>
        <Typography variant="h4" component="h2" sx={{ mb: 1.25 }}>
          {t("label.contents")}
        </Typography>
        <Stack component="ol" spacing={0.15} sx={{ listStyle: "none", p: 0, m: 0 }}>
          {toc.map((item) => (
            <Box component="li" key={item.id} sx={{ ml: `${Math.max(0, item.level - 2) * 0.85}rem` }}>
              <Link
                href={`#${item.id}`}
                underline="none"
                color="text.secondary"
                sx={{
                  display: "block",
                  py: 0.65,
                  pl: 1,
                  borderLeft: "2px solid",
                  borderColor: item.level === 2 ? "primary.main" : "divider",
                  fontSize: item.level === 2 ? "0.9rem" : "0.84rem",
                  fontWeight: item.level === 2 ? 750 : 600,
                  lineHeight: 1.45,
                  "&:hover": { color: "primary.main", borderColor: "primary.main" },
                  "&:focus-visible": { borderRadius: 0.5 }
                }}
              >
                {item.text}
              </Link>
            </Box>
          ))}
        </Stack>
      </Box>
    </Card>
  );
}

function DetailPage({
  locale,
  collection,
  slug,
  entryDetail
}: {
  locale: Locale;
  collection: Collection;
  slug: string;
  entryDetail?: PortfolioEntryDetail;
}) {
  const { t } = useTranslation();
  const entry = getEntry(locale, collection, slug);

  if (!entry) {
    return (
      <Section title="Not Found" lead="The requested content does not exist.">
        <Button href={hrefFor(collection, locale)} variant="contained">
          {locale === "ja" ? "一覧へ戻る" : "Back to list"}
        </Button>
      </Section>
    );
  }

  if (!entryDetail) {
    return <NotFoundPage locale={locale} />;
  }

  if (collection === "research" || collection === "blog") {
    return <ArticleDetailPage locale={locale} entry={entry} detail={entryDetail} />;
  }

  const demoHref = entry.collection === "projects" ? getDemoHref(entry) : "";
  const visibleLinks = entry.links.filter((link) => {
    return !["demo", "experience", "trial", "preview", "play"].includes(link.kind);
  });

  return (
    <>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <Stack spacing={2.2}>
            <Chip label={collection} color="primary" sx={{ alignSelf: "flex-start" }} />
            <Typography variant="h1" sx={{ fontSize: "clamp(2.6rem, 6.5vw, 5rem)" }}>
              {entry.title}
            </Typography>
            {entry.subtitle && (
              <Typography variant="h3" component="p" color="text.secondary" sx={{ fontWeight: 520 }}>
                {entry.subtitle}
              </Typography>
            )}
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {entry.period && <Chip label={`${t("label.period")}: ${entry.period}`} />}
              {entry.publishedAt && <Chip label={`${t("label.published")}: ${entry.publishedAt}`} />}
              {entry.updatedAt && <Chip label={`${t("label.updated")}: ${formatTimestamp(entry.updatedAt, locale)}`} />}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 280px" },
            gap: { xs: 4, lg: 6 },
            alignItems: "start"
          }}
        >
          <MarkdownArticle html={entryDetail.bodyHtml} />
          <Box
            component="aside"
            sx={{
              position: { lg: "sticky" },
              top: { lg: 100 },
              borderLeft: { lg: "1px solid" },
              borderColor: "divider",
              pl: { lg: 3 }
            }}
          >
            {demoHref && (
              <Button
                href={demoHref}
                target="_blank"
                rel="noreferrer"
                variant="contained"
                fullWidth
                endIcon={<OpenInNewRoundedIcon />}
                aria-label={`${t("action.openDemo")} (${t("label.opensInNewTab")})`}
                sx={{ mb: 3 }}
              >
                {t("action.openDemo")}
              </Button>
            )}
            {entry.canonicalUrl && (
              <Button
                href={entry.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                fullWidth
                endIcon={<OpenInNewRoundedIcon />}
                aria-label={`Zenn (${t("label.opensInNewTab")})`}
                sx={{ mb: 3 }}
              >
                Zenn
              </Button>
            )}
            <Typography variant="h4" component="h2">
              {t("label.tags")}
            </Typography>
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
              {entry.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
            {visibleLinks.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h4" component="h2">
                  {t("label.links")}
                </Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  {visibleLinks.map((link) => (
                    <Button
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      endIcon={<OpenInNewRoundedIcon />}
                      aria-label={`${link.label} (${t("label.opensInNewTab")})`}
                    >
                      {link.label}
                    </Button>
                  ))}
                </Stack>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </>
  );
}

function MarkdownArticle({ html }: { html: string }) {
  return (
    <Box
      className="markdown-article"
      dangerouslySetInnerHTML={{ __html: html }}
      sx={{
        minWidth: 0,
        fontSize: { xs: "1.02rem", md: "1.08rem" },
        lineHeight: 1.88,
        color: "text.primary",
        "& > *:first-of-type": {
          mt: 0
        },
        "& h2": {
          mt: { xs: 5, md: 6 },
          mb: 1.75,
          pt: 0.25,
          fontSize: { xs: "1.6rem", md: "1.95rem" },
          lineHeight: 1.28,
          fontWeight: 800,
          letterSpacing: "-0.015em",
          borderBottom: "1px solid",
          borderColor: "divider",
          scrollMarginTop: 112
        },
        "& h3": {
          mt: { xs: 3.75, md: 4.25 },
          mb: 1.25,
          fontSize: { xs: "1.28rem", md: "1.42rem" },
          lineHeight: 1.4,
          fontWeight: 800,
          scrollMarginTop: 112
        },
        "& h4": {
          mt: 3,
          mb: 1,
          fontSize: "1.1rem",
          lineHeight: 1.45,
          fontWeight: 800,
          scrollMarginTop: 112
        },
        "& p": {
          color: "text.primary",
          my: 1.7
        },
        "& ul, & ol": {
          pl: { xs: 2.75, md: 3.25 },
          my: 1.7
        },
        "& li": {
          mb: 0.75,
          color: "text.primary"
        },
        "& a": {
          color: "primary.main",
          fontWeight: 750,
          textUnderlineOffset: "0.16em",
          overflowWrap: "anywhere"
        },
        "& img": {
          display: "block",
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          my: 3,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper"
        },
        "& p > img + em": {
          display: "block",
          mt: -2,
          mb: 3,
          color: "text.secondary",
          fontSize: "0.9rem",
          lineHeight: 1.6
        },
        "& .markdown-table-scroll": {
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          my: 3,
          "&:focus-visible": {
            outline: "3px solid",
            outlineColor: "primary.main",
            outlineOffset: 2
          }
        },
        "& .markdown-table-scroll table": {
          width: "max-content",
          minWidth: "100%",
          maxWidth: "none",
          borderCollapse: "collapse",
          fontSize: { xs: "0.9rem", md: "0.96rem" },
          lineHeight: 1.6
        },
        "& th, & td": {
          minWidth: 120,
          border: "1px solid",
          borderColor: "divider",
          px: 1.25,
          py: 1,
          textAlign: "left",
          verticalAlign: "top"
        },
        "& th": {
          fontWeight: 800,
          backgroundColor: "action.hover"
        },
        "& blockquote": {
          m: 0,
          my: 2.5,
          pl: 2,
          borderLeft: "4px solid",
          borderColor: "primary.main",
          color: "text.secondary"
        },
        "& pre": {
          overflowX: "auto",
          my: 3,
          p: { xs: 1.5, md: 2 },
          borderRadius: 1,
          backgroundColor: "action.hover",
          border: "1px solid",
          borderColor: "divider",
          fontSize: { xs: "0.84rem", md: "0.92rem" },
          lineHeight: 1.65
        },
        "& pre code": {
          p: 0,
          backgroundColor: "transparent"
        },
        "& .markdown-video": {
          width: "100%",
          aspectRatio: "16 / 9",
          my: 3,
          overflow: "hidden",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "common.black"
        },
        "& iframe": {
          display: "block",
          width: "100%",
          maxWidth: "100%",
          border: 0
        },
        "& .markdown-video iframe": {
          height: "100%"
        },
        '& iframe[src*="youtube.com"], & iframe[src*="youtube-nocookie.com"]': {
          aspectRatio: "16 / 9"
        },
        "& code": {
          px: 0.6,
          py: 0.2,
          borderRadius: 1,
          backgroundColor: "action.hover",
          fontSize: "0.9em",
          overflowWrap: "anywhere"
        },
        "& .markdown-callout": {
          my: 3,
          px: { xs: 1.5, md: 2 },
          py: { xs: 1.25, md: 1.6 },
          borderLeft: "4px solid",
          borderColor: "primary.main",
          borderRadius: 1,
          backgroundColor: "action.hover"
        },
        "& .markdown-callout[data-callout-kind='alert']": {
          borderColor: "secondary.main"
        },
        "& .markdown-callout > *:first-of-type": {
          mt: 0
        },
        "& .markdown-callout > *:last-child": {
          mb: 0
        },
        "& .markdown-details": {
          my: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          backgroundColor: "background.paper"
        },
        "& .markdown-details summary": {
          cursor: "pointer",
          px: { xs: 1.5, md: 2 },
          py: 1.3,
          color: "primary.main",
          fontWeight: 800
        },
        "& .markdown-details > :not(summary)": {
          mx: { xs: 1.5, md: 2 }
        },
        "& .markdown-details > *:last-child": {
          mb: { xs: 1.5, md: 2 }
        }
      }}
    />
  );
}

export default function DetailRoute({ route, locale, entryDetail }: RoutePageProps) {
  if (route.kind !== "detail") {
    return <NotFoundPage locale={locale} />;
  }

  return <DetailPage locale={locale} collection={route.collection} slug={route.slug} entryDetail={entryDetail} />;
}
