import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { Locale } from "./types";

export const defaultLocale: Locale = "ja";

export const resources = {
  ja: {
    translation: {
      nav: {
        home: "Home",
        about: "About",
        research: "Research",
        projects: "Projects",
        experience: "Experience",
        blog: "Blog",
        skills: "Skills",
        contact: "Contact",
        privacy: "Privacy"
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
        getApiKey: "APIキーを取得"
      },
      apiAccess: {
        title: "API Access",
        lead: "個人開発サービス用のAPIキーを管理します。",
        signInRequired: "APIキーの取得には、先に Google で続行してください。",
        signInSuccess: "Googleログインが完了しました。",
        signInCanceled: "Googleログインをキャンセルしました。",
        popupBlocked: "Googleログインのポップアップがブロックされました。もう一度お試しください。",
        accountMismatch:
          "Googleアカウントの切り替えを検出したため、ログイン状態を初期化しました。もう一度押して選び直してください。",
        authUnavailable: "この環境ではGoogleログインを開始できません。",
        apiKeyIssued: "APIキーを発行しました。",
        apiKeyRotated: "古いAPIキーの無効化と再発行を行いました。",
        apiKeyCached: "このページセッション中に発行したAPIキーを表示しています。",
        apiKeyUnavailable: "APIキーを表示できませんでした。もう一度お試しください。",
        apiKeyCopied: "APIキーをコピーしました。",
        recentSignInRequired: "APIキーの発行には、10分以内のGoogleログインが必要です。",
        creditSummary: "本日の残りクレジット: {{remaining}} / {{daily}}",
        operationFailed: "処理に失敗しました。時間をおいて再度お試しください。",
        operationFailedWithCode: "処理に失敗しました。エラーコード: {{code}}",
        operationFailedWithDetails: "処理に失敗しました。{{code}}: {{message}}"
      },
      home: {
        title: "Takumi Tokunaga",
        lead: "Research / Projects / Experience",
        seoDescription:
          "徳永拓未（德永拓未 / とくながたくみ / トクナガタクミ / Takumi Tokunaga / Tokunaga Takumi）の個人ホームページです。研究、個人開発プロジェクト、技術スタック、経歴、AI・機械学習、Cloud Run、Firebase、教育支援システムに関する活動を掲載しています。",
        contentTitle: "Explore"
      },
      page: {
        aboutTitle: "About",
        aboutLead: "運営者情報、このサイトの目的、公開している内容の範囲をまとめています。",
        researchTitle: "Research",
        researchLead: "教育データ、local-first設計、AI活用に関する調査・実装メモをまとめています。",
        projectsTitle: "Projects",
        projectsLead: "プロジェクトの概要、技術スタック、体験用リンクをまとめています。",
        experienceTitle: "Experience",
        experienceLead: "所属先や活動期間がわかるよう、経歴を時系列でまとめています。",
        blogTitle: "Blog",
        blogLead: "Zennで公開した技術・研究・個人開発に関する記事を掲載しています。",
        skillsTitle: "Skills",
        skillsLead: "実際のプロジェクトで使っている技術領域と、設計・運用上の関心をカテゴリごとにまとめています。",
        contactTitle: "Contact",
        contactLead: "お問い合わせはこちらからお願いします。",
        privacyTitle: "Privacy & Site Policy",
        privacyLead: "アクセス解析、広告、問い合わせ、外部サービス利用に関する方針をまとめています。"
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
        published: "公開日",
        updated: "最終更新",
        noContent: "近日公開予定です。"
      }
    }
  },
  en: {
    translation: {
      nav: {
        home: "Home",
        about: "About",
        research: "Research",
        projects: "Projects",
        experience: "Experience",
        blog: "Blog",
        skills: "Skills",
        contact: "Contact",
        privacy: "Privacy"
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
        getApiKey: "Get API Key"
      },
      apiAccess: {
        title: "API Access",
        lead: "Manage an API key for personal backend services.",
        signInRequired: "Continue with Google before requesting an API key.",
        signInSuccess: "Google sign-in is complete.",
        signInCanceled: "Google sign-in was canceled.",
        popupBlocked: "The Google sign-in popup was blocked. Try again.",
        accountMismatch:
          "Google account switching was detected, so the sign-in state was reset. Click again and choose the account to use.",
        authUnavailable: "Google sign-in is not available in this environment.",
        apiKeyIssued: "API key issued.",
        apiKeyRotated: "The old API key was revoked and a new one was issued.",
        apiKeyCached: "Showing the API key issued in this page session.",
        apiKeyUnavailable: "The API key could not be displayed. Try again.",
        apiKeyCopied: "API key copied.",
        recentSignInRequired: "Issuing an API key requires Google sign-in within the last 10 minutes.",
        creditSummary: "Remaining credits today: {{remaining}} / {{daily}}",
        operationFailed: "The request failed. Try again later.",
        operationFailedWithCode: "The request failed. Error code: {{code}}",
        operationFailedWithDetails: "The request failed. {{code}}: {{message}}"
      },
      home: {
        title: "Takumi Tokunaga",
        lead: "Research / Projects / Experience",
        seoDescription:
          "Takumi Tokunaga's personal homepage, also written as Tokunaga Takumi, 徳永拓未, 德永拓未, とくながたくみ, and トクナガタクミ, covering research, personal projects, technical skills, experience, AI and machine learning, Cloud Run, Firebase, and education support systems.",
        contentTitle: "Explore"
      },
      page: {
        aboutTitle: "About",
        aboutLead: "Operator information, site purpose, and the scope of published content.",
        researchTitle: "Research",
        researchLead:
          "Research and implementation notes around education data, local-first design, and AI-assisted systems.",
        projectsTitle: "Projects",
        projectsLead: "Project summaries, technical stacks, and links to try them.",
        experienceTitle: "Experience",
        experienceLead: "Experience is organized by institution and period.",
        blogTitle: "Blog",
        blogLead: "Articles on technology, research, and independent development, originally published on Zenn.",
        skillsTitle: "Skills",
        skillsLead: "Technical areas used in real projects, grouped by implementation and operations focus.",
        contactTitle: "Contact",
        contactLead: "Use these links to get in touch.",
        privacyTitle: "Privacy & Site Policy",
        privacyLead: "Policies for analytics, advertising, contact, and external services."
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
        published: "Published",
        updated: "Last updated",
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
