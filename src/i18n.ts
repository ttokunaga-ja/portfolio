import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { Locale } from "./types";

export const defaultLocale: Locale = "ja";

export const resources = {
  ja: {
    translation: {
      nav: {
        home: "Home",
        research: "Research",
        projects: "Projects",
        experience: "Experience",
        skills: "Skills",
        contact: "Contact"
      },
      action: {
        viewResearch: "研究を見る",
        viewProjects: "プロジェクトを見る",
        contact: "連絡する",
        readMore: "詳細を見る",
        viewIndex: "一覧を見る",
        viewLatest: "詳しく見る",
        openDemo: "体験する",
        openMenu: "メニューを開く",
        skipToContent: "本文へ移動",
        switchLanguage: "Switch to English",
        github: "GitHubを開く",
        copy: "コピー",
        continueWithGoogle: "Googleで続行",
        getApiKey: "Get API Key",
        getApiKeyWithGoogle: "Get API Key(Googleで続行)"
      },
      apiAccess: {
        title: "API Access",
        lead: "個人開発サービス用のAPIキーを管理します。",
        signInRequired: "APIキーの取得には、先に Google で続行してください。",
        signInSuccess: "Googleログインが完了しました。",
        signInCanceled: "Googleログインをキャンセルしました。",
        authUnavailable: "この環境ではGoogleログインを開始できません。",
        apiKeyIssued: "APIキーを発行しました。表示されるのは今回だけです。",
        apiKeyCopied: "APIキーをコピーしました。",
        creditSummary: "本日の残りクレジット: {{remaining}} / {{daily}}",
        operationFailed: "処理に失敗しました。時間をおいて再度お試しください。"
      },
      home: {
        title: "Takumi Tokunaga",
        lead: "Research / Projects / Experience",
        seoDescription:
          "徳永拓未の個人ホームページです。研究、個人開発プロジェクト、技術スタック、経歴、AI・機械学習、Cloud Run、Firebase、教育支援システムに関する活動を掲載しています。",
        contentTitle: "Explore"
      },
      page: {
        researchTitle: "Research",
        researchLead: "研究テーマごとの背景、課題、提案、評価方針をまとめています。",
        projectsTitle: "Projects",
        projectsLead: "プロジェクトの概要、技術スタック、体験用リンクをまとめています。",
        experienceTitle: "Experience",
        experienceLead: "所属先や活動期間がわかるよう、経歴を時系列でまとめています。",
        skillsTitle: "Skills",
        skillsLead: "扱える技術領域をカテゴリごとにまとめています。",
        contactTitle: "Contact",
        contactLead: "お問い合わせはこちらからお願いします。"
      },
      label: {
        abstract: "Abstract",
        tags: "Tags",
        period: "Period",
        present: "現在",
        role: "Role",
        links: "Links",
        opensInNewTab: "新しいタブで開きます",
        latest: "最近の取り組み",
        noContent: "近日公開予定です。"
      }
    }
  },
  en: {
    translation: {
      nav: {
        home: "Home",
        research: "Research",
        projects: "Projects",
        experience: "Experience",
        skills: "Skills",
        contact: "Contact"
      },
      action: {
        viewResearch: "View Research",
        viewProjects: "View Projects",
        contact: "Contact",
        readMore: "Read More",
        viewIndex: "View All",
        viewLatest: "View Details",
        openDemo: "Try Demo",
        openMenu: "Open Menu",
        skipToContent: "Skip to content",
        switchLanguage: "日本語に切り替え",
        github: "Open GitHub",
        copy: "Copy",
        continueWithGoogle: "Continue with Google",
        getApiKey: "Get API Key",
        getApiKeyWithGoogle: "Get API Key(Continue with Google)"
      },
      apiAccess: {
        title: "API Access",
        lead: "Manage an API key for personal backend services.",
        signInRequired: "Continue with Google before requesting an API key.",
        signInSuccess: "Google sign-in is complete.",
        signInCanceled: "Google sign-in was canceled.",
        authUnavailable: "Google sign-in is not available in this environment.",
        apiKeyIssued: "API key issued. It is shown only this time.",
        apiKeyCopied: "API key copied.",
        creditSummary: "Remaining credits today: {{remaining}} / {{daily}}",
        operationFailed: "The request failed. Try again later."
      },
      home: {
        title: "Takumi Tokunaga",
        lead: "Research / Projects / Experience",
        seoDescription:
          "Takumi Tokunaga's personal portfolio covering research, personal projects, technical skills, experience, AI and machine learning, Cloud Run, Firebase, and education support systems.",
        contentTitle: "Explore"
      },
      page: {
        researchTitle: "Research",
        researchLead: "Background, problem framing, approach, and evaluation plans for research themes.",
        projectsTitle: "Projects",
        projectsLead: "Project summaries, technical stacks, and links to try them.",
        experienceTitle: "Experience",
        experienceLead: "Experience is organized by institution and period.",
        skillsTitle: "Skills",
        skillsLead: "Technical areas are grouped by category.",
        contactTitle: "Contact",
        contactLead: "Use these links to get in touch."
      },
      label: {
        abstract: "Abstract",
        tags: "Tags",
        period: "Period",
        present: "Present",
        role: "Role",
        links: "Links",
        opensInNewTab: "Opens in a new tab",
        latest: "Recent",
        noContent: "Coming soon."
      }
    }
  }
} as const;

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    interpolation: {
      escapeValue: false
    }
  });
}

export function setI18nLanguage(locale: Locale) {
  if (i18next.language !== locale) {
    i18next.changeLanguage(locale);
  }
}

export default i18next;
