import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  AppBar,
  Box,
  Button,
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
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography
} from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { setI18nLanguage } from "./i18n";
import { LocaleContext } from "./localeContext";
import { hrefFor, hrefForRoute } from "./routeLinks";
import { theme } from "./theme";
import type { Locale, PrimaryPage, RouteState } from "./types";

type AppProps = {
  initialRoute: RouteState;
  initialLocale: Locale;
  children: React.ReactNode;
};

const navItems: Array<{ page: PrimaryPage; labelKey: string; icon: React.ReactNode }> = [
  { page: "home", labelKey: "nav.home", icon: <HomeRoundedIcon /> },
  { page: "research", labelKey: "nav.research", icon: <ScienceRoundedIcon /> },
  { page: "projects", labelKey: "nav.projects", icon: <AccountTreeRoundedIcon /> },
  { page: "experience", labelKey: "nav.experience", icon: <TimelineRoundedIcon /> },
  { page: "blog", labelKey: "nav.blog", icon: <ArticleRoundedIcon /> },
  { page: "skills", labelKey: "nav.skills", icon: <CodeRoundedIcon /> },
  { page: "contact", labelKey: "nav.contact", icon: <MailOutlineRoundedIcon /> }
];

const auxiliaryNavItems: Array<{ page: PrimaryPage; labelKey: string; icon: React.ReactNode }> = [
  { page: "about", labelKey: "nav.about", icon: <InfoRoundedIcon /> },
  { page: "privacy", labelKey: "nav.privacy", icon: <PrivacyTipRoundedIcon /> }
];

const topNavItems = navItems.filter((item) => item.page !== "home");

export default function App({ initialRoute, initialLocale, children }: AppProps) {
  const locale = initialLocale;

  React.useEffect(() => {
    setI18nLanguage(locale);
    document.documentElement.lang = locale;
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
          {children}
        </Layout>
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}

function Layout({ children, locale, route }: { children: React.ReactNode; locale: Locale; route: RouteState }) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = React.useRef<HTMLAnchorElement | null>(null);
  const appBarRef = React.useRef<HTMLElement | null>(null);
  const [appBarHeight, setAppBarHeight] = React.useState(0);
  const currentPage = route.kind === "detail" ? route.collection : route.kind === "page" ? route.page : undefined;

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
    const pageScrollX = window.scrollX;
    activeMobileNavItem?.scrollIntoView({ block: "nearest", inline: "center" });
    // Keep centering within the horizontal nav from moving the entire document.
    if (window.scrollX !== pageScrollX) {
      window.scrollTo({ left: pageScrollX, top: window.scrollY });
    }
  }, [currentPage]);

  const closeMenu = React.useCallback((restoreFocus = false) => {
    setIsMenuOpen(false);
    if (restoreFocus) {
      window.setTimeout(() => menuButtonRef.current?.focus(), 0);
    }
  }, []);

  const switchLocale = React.useCallback(
    async (next: Locale) => {
      // Persist the explicit choice so the edge can honor it on future root visits.
      document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax; secure`;
      // Locale lives in the URL; navigate to the prerendered page in the target language.
      window.location.assign(await hrefForRoute(route, next));
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
                aria-expanded={isMenuOpen}
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
              aria-label={t("landmark.primaryNavigation")}
              sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}
            >
              {topNavItems.map((item) => {
                const isActive = currentPage === item.page;

                return (
                  <Button
                    key={item.page}
                    href={hrefFor(item.page, locale)}
                    aria-current={isActive ? "page" : undefined}
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
                onClick={() => void switchLocale(locale === "ja" ? "en" : "ja")}
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
            aria-label={t("landmark.primaryNavigation")}
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
                  aria-current={isActive ? "page" : undefined}
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
        <List component="nav" aria-label={t("landmark.siteNavigation")} sx={{ p: 1.5 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.page}
              ref={item.page === "home" ? firstMenuItemRef : undefined}
              component="a"
              href={hrefFor(item.page, locale)}
              aria-current={currentPage === item.page ? "page" : undefined}
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
        <Divider />
        <List component="nav" aria-label={t("landmark.siteInformationNavigation")} sx={{ p: 1.5 }}>
          {auxiliaryNavItems.map((item) => (
            <ListItemButton
              key={item.page}
              component="a"
              href={hrefFor(item.page, locale)}
              aria-current={currentPage === item.page ? "page" : undefined}
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
            useFlexGap
            flexWrap="wrap"
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
