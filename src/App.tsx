import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Drawer,
  GlobalStyles,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Stack,
  SvgIcon,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getDemoHref, getEntries, getEntry, getLatestEntry } from "./content";
import { defaultLocale, setI18nLanguage } from "./i18n";
import { getSeo, hrefFor, hrefForRoute } from "./routes";
import { theme } from "./theme";
import {
  getTrialAPIKeyState,
  issueTrialAPIKey,
  preloadTrialAuth,
  signInToTrialAuthWithGoogle,
  signOutTrialAuth,
  subscribeTrialAuthState,
  TrialAuthClientError,
  type DailyCredits
} from "./trialAuthClient";
import type { Collection, ExperienceType, Locale, PortfolioEntry, PrimaryPage, RouteState } from "./types";
import type { User as FirebaseUser } from "firebase/auth";

type AppProps = {
  initialRoute: RouteState;
  initialLocale: Locale;
};

const LocaleContext = React.createContext<Locale>(defaultLocale);
const legacyTrialAPIKeyCacheCookieName = "portfolio_trial_auth_api_key_v1";
const legacyTrialAPIKeyCacheStorageKey = "portfolio.trialAuth.apiKey.v1";
const toastAutoHideDurationMs = 5200;

type SessionTrialAPIKey = {
  apiKey: string;
  keyPrefix: string;
  dailyCredits?: DailyCredits;
};

function legacyTrialAPIKeyCookieAttributes(maxAgeSeconds: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${Math.max(0, maxAgeSeconds)}; SameSite=Strict${secure}`;
}

function clearLegacyTrialAPIKeySessionCache() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(legacyTrialAPIKeyCacheStorageKey);
  } catch {
    // Ignore storage failures. The API key is no longer persisted client-side.
  }

  if (typeof document === "undefined") {
    return;
  }

  try {
    document.cookie = `${encodeURIComponent(legacyTrialAPIKeyCacheCookieName)}=; ${legacyTrialAPIKeyCookieAttributes(
      0
    )}`;
  } catch {
    // Ignore cookie cleanup failures.
  }
}

function useLocale(): Locale {
  return React.useContext(LocaleContext);
}

const navItems: Array<{ page: PrimaryPage; labelKey: string; icon: React.ReactNode }> = [
  { page: "home", labelKey: "nav.home", icon: <HomeRoundedIcon /> },
  { page: "research", labelKey: "nav.research", icon: <ScienceRoundedIcon /> },
  { page: "projects", labelKey: "nav.projects", icon: <AccountTreeRoundedIcon /> },
  { page: "experience", labelKey: "nav.experience", icon: <TimelineRoundedIcon /> },
  { page: "skills", labelKey: "nav.skills", icon: <CodeRoundedIcon /> },
  { page: "contact", labelKey: "nav.contact", icon: <MailOutlineRoundedIcon /> }
];

const topNavItems = navItems.filter((item) => item.page !== "home");

const skillGroups: Array<{ title: string; items: string[] }> = [];

function ZennIcon() {
  return (
    <SvgIcon viewBox="0 0 88.3 88.3">
      <path d="M3.9,83.3h17c0.9,0,1.7-0.5,2.2-1.2L69.9,5.2c0.6-1-0.1-2.2-1.3-2.2H52.5c-0.8,0-1.5,0.4-1.9,1.1L3.1,81.9 C2.8,82.5,3.2,83.3,3.9,83.3z" />
      <path d="M62.5,82.1l22.1-35.5c0.7-1.1-0.1-2.5-1.4-2.5h-16c-0.6,0-1.2,0.3-1.5,0.8L43,81.2c-0.6,0.9,0.1,2.1,1.2,2.1 h16.3C61.3,83.3,62.1,82.9,62.5,82.1z" />
    </SvgIcon>
  );
}

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

function setNamedMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setPropertyMeta(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export default function App({ initialRoute, initialLocale }: AppProps) {
  const locale = initialLocale;

  React.useEffect(() => {
    const seo = getSeo(initialRoute, locale);

    setI18nLanguage(locale);
    document.documentElement.lang = locale;
    document.title = seo.title;
    setNamedMeta("description", seo.description);
    setNamedMeta("twitter:title", seo.title);
    setNamedMeta("twitter:description", seo.description);
    setPropertyMeta("og:title", seo.title);
    setPropertyMeta("og:description", seo.description);
  }, [initialRoute, locale]);

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <GlobalStyles
        styles={{
          "html, body, #root": {
            minHeight: "100%"
          },
          body: {
            backgroundColor: "var(--mui-palette-background-default)"
          },
          "*, *::before, *::after": {
            boxSizing: "border-box"
          }
        }}
      />
      <LocaleContext.Provider value={locale}>
        <Layout locale={locale} route={initialRoute}>
          <RouteSwitch route={initialRoute} locale={locale} />
        </Layout>
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}

function RouteSwitch({ route, locale }: { route: RouteState; locale: Locale }) {
  if (route.kind === "detail") {
    return <DetailPage locale={locale} collection={route.collection} slug={route.slug} />;
  }

  switch (route.page) {
    case "research":
      return <ListingPage locale={locale} collection="research" />;
    case "projects":
      return <ListingPage locale={locale} collection="projects" />;
    case "experience":
      return <ExperiencePage locale={locale} />;
    case "skills":
      return <SkillsPage />;
    case "contact":
      return <ContactPage />;
    case "home":
    default:
      return <HomePage locale={locale} />;
  }
}

function Layout({ children, locale, route }: { children: React.ReactNode; locale: Locale; route: RouteState }) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = React.useRef<HTMLAnchorElement | null>(null);
  const appBarRef = React.useRef<HTMLElement | null>(null);
  const [appBarHeight, setAppBarHeight] = React.useState(0);
  const currentPage = route.kind === "page" ? route.page : route.collection;

  React.useEffect(() => {
    const el = appBarRef.current;
    if (!el) return;

    const update = () => setAppBarHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isMenuOpen) return;

    window.requestAnimationFrame(() => {
      firstMenuItemRef.current?.focus();
    });
  }, [isMenuOpen]);

  React.useEffect(() => {
    const activeMobileNavItem = document.querySelector<HTMLElement>("[data-mobile-nav-active='true']");
    activeMobileNavItem?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [currentPage]);

  const closeMenu = React.useCallback((restoreFocus = false) => {
    setIsMenuOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => menuButtonRef.current?.focus(), 0);
    }
  }, []);

  const switchLocale = React.useCallback(
    (next: Locale) => {
      // Persist the explicit choice so the edge can honor it on future root visits.
      document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax; secure`;
      // Locale lives in the URL; navigate to the prerendered page in the target language.
      window.location.assign(hrefForRoute(route, next));
    },
    [route]
  );

  return (
    <Box>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "fixed",
          top: 8,
          left: 8,
          zIndex: (theme) => theme.zIndex.tooltip,
          transform: "translateY(-140%)",
          transition: "transform 0.15s ease",
          px: 2,
          py: 1,
          borderRadius: 1,
          backgroundColor: "background.paper",
          color: "primary.main",
          fontWeight: 800,
          boxShadow: 3,
          textDecoration: "none",
          "&:focus-visible": {
            transform: "translateY(0)",
            outline: "3px solid",
            outlineColor: "secondary.main",
            outlineOffset: 2
          }
        }}
      >
        {t("action.skipToContent")}
      </Box>
      <AppBar
        ref={appBarRef}
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(16px)",
          backgroundColor: "background.default"
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
            <Tooltip title={t("action.openMenu")}>
              <IconButton
                ref={menuButtonRef}
                aria-label={t("action.openMenu")}
                aria-controls={isMenuOpen ? "site-navigation" : undefined}
                aria-expanded={isMenuOpen ? "true" : undefined}
                onClick={() => setIsMenuOpen(true)}
                color="primary"
                edge="start"
              >
                <MenuRoundedIcon />
              </IconButton>
            </Tooltip>
            <Link
              href={hrefFor("home", locale)}
              underline="none"
              color="text.primary"
              sx={{ display: "inline-flex", alignItems: "center", gap: 1.2, minHeight: 44, mr: "auto" }}
            >
              <Box
                component="img"
                src="/images/logo.png"
                alt=""
                aria-hidden="true"
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  objectFit: "contain"
                }}
              />
              <Typography component="span" fontWeight={800}>
                Takumi Tokunaga
              </Typography>
            </Link>

            <Stack
              component="nav"
              direction="row"
              spacing={0.5}
              aria-label="Primary navigation"
              sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
            >
              {topNavItems.map((item) => {
                const isActive = currentPage === item.page;

                return (
                  <Button
                    key={item.page}
                    href={hrefFor(item.page, locale)}
                    variant="text"
                    color="primary"
                    sx={{
                      minWidth: 0,
                      px: 1.4,
                      borderRadius: 1,
                      color: isActive ? "primary.main" : "text.secondary",
                      fontWeight: isActive ? 800 : 700,
                      backgroundColor: isActive ? "action.selected" : "transparent",
                      "&:hover": {
                        backgroundColor: isActive ? "action.selected" : "action.hover"
                      }
                    }}
                  >
                    {t(item.labelKey)}
                  </Button>
                );
              })}
            </Stack>

            <Tooltip title={t("action.switchLanguage")}>
              <IconButton
                aria-label={t("action.switchLanguage")}
                onClick={() => switchLocale(locale === "ja" ? "en" : "ja")}
                color="primary"
              >
                <LanguageRoundedIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
          <Stack
            component="nav"
            direction="row"
            spacing={0.5}
            aria-label="Primary navigation"
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              overflowX: "auto",
              pb: 1.25,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none"
              }
            }}
          >
            {topNavItems.map((item) => {
              const isActive = currentPage === item.page;

              return (
                <Button
                  key={item.page}
                  href={hrefFor(item.page, locale)}
                  variant="text"
                  color="primary"
                  data-mobile-nav-active={isActive ? "true" : undefined}
                  sx={{
                    minWidth: "max-content",
                    px: 1.3,
                    borderRadius: 1,
                    color: isActive ? "primary.main" : "text.secondary",
                    fontWeight: isActive ? 800 : 700,
                    backgroundColor: isActive ? "action.selected" : "transparent",
                    "&:hover": {
                      backgroundColor: isActive ? "action.selected" : "action.hover"
                    }
                  }}
                >
                  {t(item.labelKey)}
                </Button>
              );
            })}
          </Stack>
        </Container>
      </AppBar>
      <Drawer
        id="site-navigation"
        anchor="left"
        open={isMenuOpen}
        onClose={() => closeMenu(true)}
        PaperProps={{
          sx: {
            width: 300,
            maxWidth: "84vw",
            top: appBarHeight,
            height: appBarHeight ? `calc(100% - ${appBarHeight}px)` : "100%",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8
          }
        }}
        sx={{ "& .MuiBackdrop-root": { top: appBarHeight } }}
      >
        <Box sx={{ p: 2.5 }}>
          <Link href={hrefFor("home", locale)} underline="none" color="text.primary" onClick={() => closeMenu(false)}>
            <Typography variant="h4" component="p">
              Takumi Tokunaga
            </Typography>
          </Link>
        </Box>
        <Divider />
        <List component="nav" aria-label="Site navigation" sx={{ p: 1.5 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.page}
              ref={item.page === "home" ? firstMenuItemRef : undefined}
              component="a"
              href={hrefFor(item.page, locale)}
              selected={currentPage === item.page}
              onClick={() => closeMenu(false)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: currentPage === item.page ? "primary.main" : "text.secondary" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={t(item.labelKey)} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box id="main-content" component="main" tabIndex={-1}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{ borderTop: "1px solid", borderColor: "divider", py: 5, mt: 8, textAlign: "center" }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems="center"
            justifyContent="center"
            textAlign="center"
          >
            <Typography color="text.secondary" aria-label="Copyright Takumi Tokunaga">
              ©
            </Typography>
            <Button
              href="https://github.com/ttokunaga-ja"
              target="_blank"
              rel="noreferrer"
              aria-label={`GitHub (${t("label.opensInNewTab")})`}
              variant="text"
              startIcon={<GitHubIcon />}
              endIcon={<OpenInNewRoundedIcon />}
            >
              GitHub
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

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
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
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
  const locale = useLocale();

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

function Section({
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

function PageHead({
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

function ListingPage({ locale, collection }: { locale: Locale; collection: Collection }) {
  const { t } = useTranslation();
  const entries = getEntries(locale, collection);
  const title = collection === "research" ? t("page.researchTitle") : t("page.projectsTitle");
  const lead = collection === "research" ? t("page.researchLead") : t("page.projectsLead");
  const icon = collection === "research" ? <ScienceRoundedIcon /> : <AccountTreeRoundedIcon />;

  return (
    <>
      <PageHead icon={icon} title={title} lead={lead} />
      <Section title={title} lead={t("label.abstract")}>
        <EntryGrid entries={entries} />
      </Section>
    </>
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

function EmptyState({ message }: { message: string }) {
  return (
    <Card variant="outlined">
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">{message}</Typography>
      </Box>
    </Card>
  );
}

function EntryCard({ entry }: { entry: PortfolioEntry }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const demoHref = entry.collection === "projects" ? getDemoHref(entry) : "";

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <Stack spacing={2} sx={{ p: 2.5, height: "100%" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="overline" color="primary" fontWeight={800}>
            {entry.collection}
          </Typography>
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
  const locale = useLocale();
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
                {entry.startLabel || entry.startDate || entry.period || "-"}
              </Typography>
              <Typography aria-hidden="true" sx={{ lineHeight: 1 }}>
                -
              </Typography>
              <Typography fontWeight={800} sx={{ fontSize: { xs: "0.72rem", md: "0.84rem" } }}>
                {entry.endLabel || entry.endDate || t("label.present")}
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

function ContactPage() {
  const { t } = useTranslation();
  const contacts = [
    {
      label: "GitHub",
      href: "https://github.com/ttokunaga-ja",
      icon: <GitHubIcon />
    },
    {
      label: "Zenn",
      href: "https://zenn.dev/t_tokunaga",
      icon: <ZennIcon />
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/%E6%8B%93%E6%9C%AA-%E5%BE%B3%E6%B0%B8-725094354/",
      icon: <LinkedInIcon />
    },
    {
      label: "Mail",
      href: "mailto:ttokunaga.ja@gmail.com",
      icon: <MailOutlineRoundedIcon />
    }
  ];

  return (
    <>
      <PageHead
        icon={<MailOutlineRoundedIcon />}
        title={t("page.contactTitle")}
        lead={t("page.contactLead")}
        align="center"
      />
      <Section title={t("page.contactTitle")} lead={t("page.contactLead")} align="center">
        <Box sx={{ maxWidth: 760, mx: "auto", textAlign: "center" }}>
          <Stack spacing={1.5}>
            <ApiAccessPanel />
            {contacts.map((contact) => {
              const isExternal = Boolean(contact.href?.startsWith("http"));
              const content = (
                <>
                  <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>{contact.icon}</Box>
                  <Typography fontWeight={800}>{contact.label}</Typography>
                </>
              );

              if (!contact.href) {
                return (
                  <Box
                    key={contact.label}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      px: 2,
                      py: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      backgroundColor: "background.paper",
                      color: "text.primary",
                      textAlign: "center"
                    }}
                  >
                    {content}
                  </Box>
                );
              }

              return (
                <Box
                  key={contact.label}
                  component="a"
                  href={contact.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  aria-label={isExternal ? `${contact.label} (${t("label.opensInNewTab")})` : undefined}
                  sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    px: 2,
                    py: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    backgroundColor: "background.paper",
                    color: "text.primary",
                    textAlign: "center",
                    textDecoration: "none",
                    "&:hover": {
                      borderColor: "primary.main"
                    }
                  }}
                >
                  {content}
                  {isExternal && <OpenInNewRoundedIcon sx={{ position: "absolute", top: 14, right: 14 }} />}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Section>
    </>
  );
}

function ApiAccessPanel() {
  const { t } = useTranslation();
  const [, setAuthUser] = React.useState<FirebaseUser | null>(null);
  const [sessionAPIKey, setSessionAPIKey] = React.useState<SessionTrialAPIKey | null>(null);
  const [isBusy, setIsBusy] = React.useState(false);
  const toastIdRef = React.useRef(0);
  const [toast, setToast] = React.useState<{
    id: number;
    message: string;
    detail?: string;
    severity: "info" | "success" | "warning" | "error";
    apiKey?: string;
  } | null>(null);

  React.useEffect(() => {
    clearLegacyTrialAPIKeySessionCache();
    const unsubscribe = subscribeTrialAuthState(setAuthUser);
    void preloadTrialAuth().catch(() => undefined);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (!toast || toast.apiKey) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, toastAutoHideDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toast]);

  const showToast = (
    message: string,
    severity: "info" | "success" | "warning" | "error",
    apiKey?: string,
    detail?: string
  ) => {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message, severity, apiKey, detail });
  };

  const closeToast = () => {
    setToast(null);
  };

  const warmUpTrialAuth = () => {
    void preloadTrialAuth().catch(() => undefined);
  };

  const creditSummary = (credits?: DailyCredits) => {
    if (!credits) {
      return "";
    }
    return t("apiAccess.creditSummary", {
      remaining: credits.remainingCredits,
      daily: credits.dailyLimit
    });
  };

  const getFriendlyError = (error: unknown) => {
    if (error instanceof TrialAuthClientError && (error.code === "BROWSER_ONLY" || error.code === "CONFIG_MISSING")) {
      return t("apiAccess.authUnavailable");
    }
    if (error instanceof TrialAuthClientError && error.code === "RECENT_SIGN_IN_REQUIRED") {
      return t("apiAccess.recentSignInRequired");
    }
    if (error instanceof Error && "code" in error && error.code === "auth/user-mismatch") {
      return t("apiAccess.accountMismatch");
    }
    if (error instanceof Error && "code" in error && error.code === "auth/popup-closed-by-user") {
      return t("apiAccess.signInCanceled");
    }
    if (error instanceof Error && "code" in error && error.code === "auth/popup-blocked") {
      return t("apiAccess.popupBlocked");
    }
    const errorCode =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
        ? error.code
        : "";
    const errorMessage = error instanceof Error ? error.message.replace(/\s+/g, " ").trim().slice(0, 180) : "";
    return errorCode
      ? t(errorMessage ? "apiAccess.operationFailedWithDetails" : "apiAccess.operationFailedWithCode", {
          code: errorCode,
          message: errorMessage
        })
      : t("apiAccess.operationFailed");
  };

  const handleIssueAPIKey = async () => {
    setIsBusy(true);
    try {
      if (sessionAPIKey) {
        showToast(
          t("apiAccess.apiKeyCached"),
          "success",
          sessionAPIKey.apiKey,
          creditSummary(sessionAPIKey.dailyCredits)
        );
        return;
      }

      clearLegacyTrialAPIKeySessionCache();
      setSessionAPIKey(null);
      setAuthUser(null);
      await signOutTrialAuth().catch(() => undefined);

      const user = await signInToTrialAuthWithGoogle({ forceLogin: true });
      setAuthUser(user);

      const previousKeyState = await getTrialAPIKeyState(user);
      const issued = await issueTrialAPIKey(user);
      if (!issued.apiKey) {
        setSessionAPIKey(null);
        showToast(t("apiAccess.apiKeyUnavailable"), "warning", undefined, creditSummary(issued.dailyCredits));
        return;
      }
      setSessionAPIKey({
        apiKey: issued.apiKey,
        keyPrefix: issued.keyPrefix,
        dailyCredits: issued.dailyCredits
      });
      showToast(
        t(previousKeyState.hasKey && !previousKeyState.revoked ? "apiAccess.apiKeyRotated" : "apiAccess.apiKeyIssued"),
        "success",
        issued.apiKey,
        creditSummary(issued.dailyCredits)
      );
    } catch (error) {
      if (error instanceof TrialAuthClientError && error.code === "RECENT_SIGN_IN_REQUIRED") {
        setSessionAPIKey(null);
      }
      if (error instanceof Error && "code" in error && error.code === "auth/user-mismatch") {
        setSessionAPIKey(null);
        setAuthUser(null);
        await signOutTrialAuth().catch(() => undefined);
      }
      showToast(getFriendlyError(error), "error");
    } finally {
      setIsBusy(false);
    }
  };

  const copyAPIKey = async () => {
    if (!toast?.apiKey) {
      return;
    }
    await navigator.clipboard.writeText(toast.apiKey);
    showToast(t("apiAccess.apiKeyCopied"), "success");
  };

  return (
    <>
      <Box
        id="api-access"
        component="button"
        type="button"
        disabled={isBusy}
        aria-busy={isBusy}
        onClick={handleIssueAPIKey}
        onFocus={warmUpTrialAuth}
        onMouseEnter={warmUpTrialAuth}
        onPointerDown={warmUpTrialAuth}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          width: "100%",
          px: 2,
          py: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          backgroundColor: "background.paper",
          color: "text.primary",
          cursor: "pointer",
          font: "inherit",
          textAlign: "center",
          "&:hover": {
            borderColor: "primary.main"
          },
          "&:disabled": {
            cursor: "not-allowed",
            opacity: 0.72
          }
        }}
      >
        <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
          <GoogleIcon />
        </Box>
        <Stack spacing={0.25} alignItems="center">
          <Typography fontWeight={800}>{t("action.getApiKey")}</Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {t("action.continueWithGoogle")}
          </Typography>
        </Stack>
      </Box>
      <Snackbar
        key={toast?.id ?? "api-access-toast"}
        open={Boolean(toast)}
        autoHideDuration={toast?.apiKey ? null : toastAutoHideDurationMs}
        disableWindowBlurListener
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeToast} severity={toast?.severity ?? "info"} variant="filled" sx={{ width: "100%" }}>
          <Stack spacing={1}>
            <Typography variant="body2">{toast?.message}</Typography>
            {toast?.detail && <Typography variant="body2">{toast.detail}</Typography>}
            {toast?.apiKey && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Typography
                  component="code"
                  variant="body2"
                  sx={{
                    px: 1,
                    py: 0.75,
                    border: "1px solid",
                    borderColor: "currentColor",
                    borderRadius: 1,
                    color: "inherit",
                    wordBreak: "break-all"
                  }}
                >
                  {toast.apiKey}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyRoundedIcon />}
                  onClick={copyAPIKey}
                  sx={{ borderColor: "currentColor", color: "inherit" }}
                >
                  {t("action.copy")}
                </Button>
              </Stack>
            )}
          </Stack>
        </Alert>
      </Snackbar>
    </>
  );
}

function DetailPage({ locale, collection, slug }: { locale: Locale; collection: Collection; slug: string }) {
  const { t } = useTranslation();
  const entry = getEntry(locale, collection, slug);

  if (!entry) {
    return (
      <Section title="Not Found" lead="The requested content does not exist.">
        <Button href={`/${collection}/`} variant="contained">
          Back
        </Button>
      </Section>
    );
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
          <MarkdownArticle html={entry.bodyHtml} />
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
        fontSize: "1.06rem",
        lineHeight: 1.78,
        color: "text.primary",
        "& > *:first-of-type": {
          mt: 0
        },
        "& h2": {
          mt: 5,
          mb: 1.5,
          fontSize: "1.8rem",
          lineHeight: 1.2
        },
        "& h3": {
          mt: 3.5,
          mb: 1,
          fontSize: "1.25rem"
        },
        "& p": {
          color: "text.secondary"
        },
        "& ul": {
          pl: 3
        },
        "& li": {
          mb: 0.7,
          color: "text.secondary"
        },
        "& a": {
          color: "primary.main",
          fontWeight: 700
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
          backgroundColor: "action.hover"
        }
      }}
    />
  );
}
