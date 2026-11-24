import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  ssr: {
    noExternal: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@mui/utils",
      "@mui/styled-engine",
      "@mui/private-theming"
    ]
  }
});
try {
  const { default: Home } = await server.ssrLoadModule("/src/pages/home.tsx");
  const { default: About } = await server.ssrLoadModule("/src/pages/about.tsx");
  const { default: Skills } = await server.ssrLoadModule("/src/pages/skills.tsx");
  const { LocaleContext } = await server.ssrLoadModule("/src/localeContext.ts");
  const { setI18nLanguage } = await server.ssrLoadModule("/src/i18n.ts");
  function render(Page, locale) {
    setI18nLanguage(locale);
    return renderToStaticMarkup(
      React.createElement(LocaleContext.Provider, { value: locale }, React.createElement(Page, { locale }))
    );
  }
  for (const locale of ["ja", "en"]) {
    test(`${locale} Home uses one timeline without cards, category sections, or an Experience promotion`, () => {
      const html = render(Home, locale);
      assert.match(html, /aria-label="(?:最新の更新|Latest updates)"/);
      assert.equal((html.match(/<article\b/g) || []).length, 3);
      assert.ok(!html.includes("MuiCard-root"));
      assert.ok(!html.includes("/experience/"));
      for (const collection of ["research", "projects", "blog"]) {
        assert.match(html, new RegExp(`href="(?:/en)?/${collection}/[^/]+/"`));
      }
      assert.ok(html.includes("A Seated Hand-Tapping Locomotion Technique"));
    });
    test(`${locale} About retains editorial policy and distinguishes future education`, () => {
      const html = render(About, locale);
      assert.match(html, locale === "ja" ? /編集方針/ : /Editorial policy/);
      assert.match(html, locale === "ja" ? /2027年4月に立命館大学大学院へ入学予定/ : /plan to enter graduate study/);
      assert.match(html, /href="(?:\/en)?\/contact\/"/);
    });
    test(`${locale} Skills connect six technical areas to evidence`, () => {
      const html = render(Skills, locale);
      assert.equal((html.match(/<h3\b/g) || []).length, 6);
      const categories =
        locale === "ja"
          ? [
              "プログラミング言語",
              "フロントエンド",
              "バックエンド・データベース",
              "クラウド・デプロイ",
              "データ処理・機械学習",
              "XR・リアルタイム通信"
            ]
          : [
              "Programming Languages",
              "Frontend",
              "Backend &amp; Databases",
              "Cloud &amp; Deployment",
              "Data Processing &amp; Machine Learning",
              "XR &amp; Real-Time Communication"
            ];
      const listedSkills = [...html.matchAll(/<li\b[^>]*>([^<]+)<\/li>/g)].map((match) => match[1]);
      assert.deepEqual(listedSkills, [
        "Go",
        "Rust",
        "TypeScript",
        "Python",
        "C#",
        "React",
        "Vite",
        "Material UI",
        "Three.js",
        "OpenAPI",
        "gRPC",
        "PostgreSQL",
        "AWS",
        "Google Cloud Run",
        "Cloudflare Workers",
        "Cloudflare Pages",
        "GitHub Actions",
        "NumPy",
        "TensorFlow",
        "pandas",
        "scikit-learn",
        "Unity",
        "VR／MR",
        "WebSocket",
        "UDP"
      ]);
      for (const category of categories) assert.ok(html.includes(category), category);
      assert.match(html, /github.com\/ttokunaga-ja\/Group4_MoleWhack/);
      assert.match(html, /href="(?:\/en)?\/projects\/kio\/"/);
      assert.match(html, /href="(?:\/en)?\/awards\/handslap-race\/"/);
    });
  }
} finally {
  await server.close();
}
