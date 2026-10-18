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
      landmark: {
        primaryNavigation: "主要ナビゲーション",
        siteNavigation: "サイトナビゲーション",
        siteInformationNavigation: "サイト情報ナビゲーション"
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
        readOnZenn: "Zennで読む",
        readJapaneseOriginal: "日本語の原文を読む",
        viewJapaneseBlog: "日本語の記事一覧を見る",
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
        apiKeyCopyFailed: "APIキーをコピーできませんでした。表示されているキーを選択してコピーしてください。",
        issuingApiKey: "APIキーを発行しています…",
        preparingApiAccess: "Googleログインを準備しています…",
        recentSignInRequired: "APIキーの発行には、10分以内のGoogleログインが必要です。",
        creditSummary: "本日の残りクレジット: {{remaining}} / {{daily}}",
        operationFailed: "処理に失敗しました。時間をおいて再度お試しください。",
        operationFailedWithCode: "処理に失敗しました。エラーコード: {{code}}",
        operationFailedWithDetails: "処理に失敗しました。{{code}}: {{message}}"
      },
      home: {
        title: "徳永拓未 / Takumi Tokunaga",
        updatesLabel: "最新の更新",
        lead: "研究を支えるシステムと、日常の課題を解くソフトウェアを開発しています。",
        introduction:
          "立命館大学で情報理工学を学びながら、研究システムと個人開発に取り組んでいます。個人開発では、GoによるAPI、RustによるCLI、ブラウザで使えるツールを制作しています。",
        contributions:
          "共同研究のHandSlapRaceでは、サーバー実装と、Unity開発のPMとして実装・進捗確認・品質保証を担当し、リアルタイムゲームの通信品質改善にも取り組みました。",
        educationPlans:
          "2027年3月に学部卒業予定。2027年4月に立命館大学大学院へ入学予定で、2029年3月の修士課程修了を予定しています。",
        seoDescription:
          "徳永拓未の研究・開発ポートフォリオ。VR研究でのサーバー実装、Unity開発の実装・進捗確認・品質保証、GoのAPI、RustのCLI、Webツールを紹介します。"
      },
      page: {
        aboutTitle: "About",
        aboutLead: "徳永拓未のプロフィール、学歴の予定、研究での担当とサイト運営情報をまとめています。",
        researchTitle: "Research",
        researchLead: "共同研究HandSlapRaceのシステム概要、サーバー実装、Unity開発と品質保証での担当を紹介します。",
        projectsTitle: "Projects",
        projectsLead: "プロジェクトの概要、技術スタック、体験用リンクをまとめています。",
        experienceTitle: "Experience",
        experienceLead: "所属先や活動期間がわかるよう、経歴を時系列でまとめています。",
        blogTitle: "Blog",
        blogLead: "Zennで公開した技術・研究・個人開発に関する記事を掲載しています。",
        skillsTitle: "Skills",
        skillsLead: "Rust、Go、Unity / C#、React、Pythonと品質保証について、扱った内容と具体的な実例を紹介します。",
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
        contents: "目次",
        topics: "トピック",
        source: "公開元",
        aiTranslation: "AI翻訳",
        aiTranslationNotice:
          "この記事は日本語の原文をAIで英訳したものです。誤訳の可能性があるため、原文もご確認ください。",
        blogTranslationNotice:
          "英訳にはAIを使用しています。原文の更新中は、一部の英訳を一時的に非公開にする場合があります。",
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
      landmark: {
        primaryNavigation: "Primary navigation",
        siteNavigation: "Site navigation",
        siteInformationNavigation: "Site information navigation"
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
        readOnZenn: "Read on Zenn",
        readJapaneseOriginal: "Read the Japanese original",
        viewJapaneseBlog: "View the Japanese blog",
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
        apiKeyCopyFailed: "The API key could not be copied. Select the visible key and copy it manually.",
        issuingApiKey: "Issuing API key…",
        preparingApiAccess: "Preparing Google sign-in…",
        recentSignInRequired: "Issuing an API key requires Google sign-in within the last 10 minutes.",
        creditSummary: "Remaining credits today: {{remaining}} / {{daily}}",
        operationFailed: "The request failed. Try again later.",
        operationFailedWithCode: "The request failed. Error code: {{code}}",
        operationFailedWithDetails: "The request failed. {{code}}: {{message}}"
      },
      home: {
        title: "Takumi Tokunaga",
        updatesLabel: "Latest updates",
        lead: "I build systems for research and software for everyday problems.",
        introduction:
          "I study information science and engineering at Ritsumeikan University and work on research systems and independent software projects. My independent projects include APIs in Go, command-line tools in Rust, and browser-based utilities.",
        contributions:
          "For the collaborative HandSlapRace project, I handled server implementation and served as the project manager for Unity development, including implementation, progress tracking, and quality assurance. I also worked on improving communication quality in the real-time game.",
        educationPlans:
          "I expect to complete my undergraduate studies in March 2027. I plan to enter graduate study at Ritsumeikan University in April 2027, with completion of the master's program expected in March 2029.",
        seoDescription:
          "Takumi Tokunaga's research and software portfolio, covering VR server implementation, Unity development and QA, Go APIs, Rust command-line tools, and web applications."
      },
      page: {
        aboutTitle: "About",
        aboutLead: "Takumi Tokunaga’s profile, education plans, research contributions, and site information.",
        researchTitle: "Research",
        researchLead:
          "The collaborative HandSlapRace system and my contributions to server implementation, Unity development, and quality assurance.",
        projectsTitle: "Projects",
        projectsLead: "Project summaries, technical stacks, and links to try them.",
        experienceTitle: "Experience",
        experienceLead: "Experience is organized by institution and period.",
        blogTitle: "Blog",
        blogLead: "Articles on technology, research, and independent development, originally published on Zenn.",
        skillsTitle: "Skills",
        skillsLead:
          "Rust, Go, Unity / C#, React, Python, and quality assurance, with descriptions and concrete project evidence.",
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
        contents: "Contents",
        topics: "Topics",
        source: "Published on",
        aiTranslation: "AI translation",
        aiTranslationNotice:
          "This English translation was generated with AI and may contain errors. Refer to the Japanese original for the authoritative wording.",
        blogTranslationNotice:
          "AI-generated translations may contain errors. Some translations may be temporarily unavailable while they are updated.",
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
