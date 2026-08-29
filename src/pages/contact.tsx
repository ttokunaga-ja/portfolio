import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Alert, Box, Button, Snackbar, Stack, SvgIcon, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Section } from "../pagePrimitives";
import type { RoutePageProps } from "../routePageTypes";
import {
  getTrialAPIKeyState,
  issueTrialAPIKey,
  preloadTrialAuth,
  signInToTrialAuthWithGoogle,
  signOutTrialAuth,
  subscribeTrialAuthState,
  TrialAuthClientError,
  type DailyCredits
} from "../trialAuthClient";
import type { User as FirebaseUser } from "firebase/auth";

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

function ZennIcon() {
  return (
    <SvgIcon viewBox="0 0 88.3 88.3">
      <path d="M3.9,83.3h17c0.9,0,1.7-0.5,2.2-1.2L69.9,5.2c0.6-1-0.1-2.2-1.3-2.2H52.5c-0.8,0-1.5,0.4-1.9,1.1L3.1,81.9 C2.8,82.5,3.2,83.3,3.9,83.3z" />
      <path d="M62.5,82.1l22.1-35.5c0.7-1.1-0.1-2.5-1.4-2.5h-16c-0.6,0-1.2,0.3-1.5,0.8L43,81.2c-0.6,0.9,0.1,2.1,1.2,2.1 h16.3C61.3,83.3,62.1,82.9,62.5,82.1z" />
    </SvgIcon>
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
  const [authPreparation, setAuthPreparation] = React.useState<"preparing" | "ready" | "unavailable">("preparing");
  const toastIdRef = React.useRef(0);
  const trialAuthUnsubscribeRef = React.useRef<(() => void) | null>(null);
  const [toast, setToast] = React.useState<{
    id: number;
    message: string;
    detail?: string;
    severity: "info" | "success" | "warning" | "error";
    apiKey?: string;
  } | null>(null);

  React.useEffect(() => {
    clearLegacyTrialAPIKeySessionCache();
    let active = true;

    // This panel only renders on Contact, so preload here keeps Firebase out of
    // other routes while guaranteeing a cached, activation-safe popup on click.
    void preloadTrialAuth()
      .then(() => {
        if (!active) return;
        setAuthPreparation("ready");
        if (!trialAuthUnsubscribeRef.current) {
          trialAuthUnsubscribeRef.current = subscribeTrialAuthState(setAuthUser);
        }
      })
      .catch(() => {
        if (active) setAuthPreparation("unavailable");
      });

    return () => {
      active = false;
      trialAuthUnsubscribeRef.current?.();
      trialAuthUnsubscribeRef.current = null;
    };
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
    if (authPreparation !== "ready" || isBusy) {
      return;
    }
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
      // Call signInWithPopup synchronously from this user gesture. Waiting for a
      // sign-out or module preparation first can make browsers reject the popup.
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

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }
      await navigator.clipboard.writeText(toast.apiKey);
      showToast(t("apiAccess.apiKeyCopied"), "success");
    } catch {
      // Keep the key in the alert so it remains selectable for a manual copy.
      showToast(t("apiAccess.apiKeyCopyFailed"), "error", toast.apiKey, toast.detail);
    }
  };

  const apiAccessStatusLabel = isBusy
    ? t("apiAccess.issuingApiKey")
    : authPreparation === "preparing"
      ? t("apiAccess.preparingApiAccess")
      : authPreparation === "unavailable"
        ? t("apiAccess.authUnavailable")
        : t("action.getApiKey");

  return (
    <>
      <Box
        id="api-access"
        component="button"
        type="button"
        disabled={isBusy || authPreparation !== "ready"}
        aria-busy={isBusy || authPreparation === "preparing"}
        onClick={handleIssueAPIKey}
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
            {authPreparation === "ready" && !isBusy ? t("action.continueWithGoogle") : apiAccessStatusLabel}
          </Typography>
        </Stack>
      </Box>
      <Typography
        role="status"
        aria-live="polite"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          p: 0,
          m: -1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0
        }}
      >
        {isBusy || authPreparation === "preparing" ? apiAccessStatusLabel : ""}
      </Typography>
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

export default function ContactRoute(_props: RoutePageProps) {
  return <ContactPage />;
}
