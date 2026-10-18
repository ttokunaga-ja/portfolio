import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Box, Button, Container, Link, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getEntryDate, getHomeTimeline } from "../content";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";

export default function HomeRoute({ locale }: RoutePageProps) {
  const { t } = useTranslation();
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box
        component="header"
        sx={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          minHeight: { xs: 600, md: 680 },
          mb: { xs: 4, md: 5 },
          borderRadius: 1,
          backgroundColor: "#101010",
          color: "#fff"
        }}
      >
        <Box
          component="img"
          src="/images/profile.webp"
          alt=""
          aria-hidden="true"
          width={1200}
          height={1558}
          fetchPriority="high"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: { xs: "50% 20%", md: "50% 25%" }
          }}
        />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            background: {
              xs: "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0) 70%)",
              md: "linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 22%, rgba(0,0,0,0) 62%)"
            }
          }}
        />
        <Box
          sx={{
            position: "relative",
            width: "100%",
            px: { xs: 3, md: 5 },
            pb: { xs: "200px", md: 6 },
            pt: 5,
            textAlign: "center"
          }}
        >
          <Typography variant="h1" sx={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)" }}>
            {t("home.title")}
          </Typography>
          <Typography sx={{ mt: 1.5, lineHeight: 1.8, maxWidth: 760, mx: "auto" }}>{t("home.lead")}</Typography>
        </Box>
      </Box>
      <Stack component="ol" aria-label={t("home.updatesLabel")} sx={{ m: 0, p: 0, listStyle: "none" }}>
        {getHomeTimeline(locale).map((entry) => {
          const date = getEntryDate(entry);
          return (
            <Box
              component="li"
              key={`${entry.collection}/${entry.slug}`}
              sx={{
                position: "relative",
                pl: { xs: 2.5, md: 4 },
                pb: 4,
                borderLeft: "1px solid",
                borderColor: "divider",
                "&:last-child": { pb: 0 }
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  position: "absolute",
                  left: -4.5,
                  top: 8,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "primary.main"
                }}
              />
              <Box component="article">
                <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 0.8 }}>
                  <Typography variant="overline" color="primary" fontWeight={700}>
                    {t(`nav.${entry.collection}`)}
                  </Typography>
                  {date && (
                    <Typography component="time" dateTime={date} variant="body2" color="text.secondary">
                      {date.slice(0, 10)}
                    </Typography>
                  )}
                </Stack>
                <Typography variant="h2" sx={{ fontSize: { xs: "1.4rem", md: "1.75rem" }, lineHeight: 1.35 }}>
                  <Link
                    href={hrefFor({ collection: entry.collection, slug: entry.slug }, locale)}
                    color="text.primary"
                    underline="hover"
                    sx={{ display: "inline-flex", gap: 1, alignItems: "baseline" }}
                  >
                    {entry.title}
                    <ArrowForwardRoundedIcon aria-hidden="true" sx={{ fontSize: "1.1rem", flexShrink: 0 }} />
                  </Link>
                </Typography>
                {entry.subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7 }}>
                    {entry.subtitle}
                  </Typography>
                )}
                <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 900 }}>
                  {entry.abstract}
                </Typography>
              </Box>
              <Box sx={{ mt: 2.5, textAlign: "center" }}>
                <Button
                  href={hrefFor(entry.collection, locale)}
                  variant="outlined"
                  endIcon={<ArrowForwardRoundedIcon />}
                >
                  {t("home.viewCollection", { collection: t(`nav.${entry.collection}`) })}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Container>
  );
}
