import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import { Box, Card, Link, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Section, usePageLocale } from "../pagePrimitives";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";

function SkillsPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const ja = locale === "ja";
  const sdb = hrefFor({ collection: "projects", slug: "2026-06-07-sdb-school-university-database-api" }, locale);
  const handSlapRaceAward = hrefFor({ collection: "awards", slug: "handslap-race" }, locale);
  const groups = [
    {
      title: ja ? "プログラミング言語" : "Programming Languages",
      skills: ["Go", "Rust", "TypeScript", "Python", "C#"],
      links: [{ label: "Kio", href: hrefFor({ collection: "projects", slug: "kio" }, locale) }]
    },
    {
      title: ja ? "フロントエンド" : "Frontend",
      skills: ["React", "Vite", "Material UI", "Three.js"],
      links: [
        {
          label: "3D Maze Game",
          href: hrefFor({ collection: "projects", slug: "2026-06-07-threejs-3d-maze-game" }, locale)
        },
        { label: t("nav.projects"), href: hrefFor("projects", locale) }
      ]
    },
    {
      title: ja ? "バックエンド・データベース" : "Backend & Databases",
      skills: ["OpenAPI", "gRPC", "PostgreSQL"],
      links: [{ label: "sDB", href: sdb }]
    },
    {
      title: ja ? "クラウド・デプロイ" : "Cloud & Deployment",
      skills: ["AWS", "Google Cloud Run", "Cloudflare Workers", "Cloudflare Pages", "GitHub Actions"],
      links: [{ label: "portfolio", href: "https://github.com/ttokunaga-ja/portfolio" }]
    },
    {
      title: ja ? "データ処理・機械学習" : "Data Processing & Machine Learning",
      skills: ["NumPy", "TensorFlow", "pandas", "scikit-learn"],
      links: [{ label: ja ? "sDB 公開リポジトリ" : "sDB repository", href: "https://github.com/ttokunaga-ja/sDB" }]
    },
    {
      title: ja ? "XR・リアルタイム通信" : "XR & Real-Time Communication",
      skills: ["Unity", "VR／MR", "WebSocket", "UDP"],
      links: [
        { label: "Group4_MoleWhack", href: "https://github.com/ttokunaga-ja/Group4_MoleWhack" },
        {
          label: ja ? "QR追跡と配置の技術記事" : "QR tracking and placement (Japanese)",
          href: "https://zenn.dev/t_tokunaga/articles/2025-12-02-unity-quest3s-qrcode-detection"
        },
        { label: "HandSlapRace", href: handSlapRaceAward }
      ]
    }
  ];
  return (
    <>
      <PageHead icon={<CodeRoundedIcon />} title={t("page.skillsTitle")} lead={t("page.skillsLead")} />
      <Section title={ja ? "技術と実例" : "Technical work and evidence"}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
            gap: 2.5
          }}
        >
          {groups.map((group) => (
            <Card key={group.title} variant="outlined">
              <Stack spacing={2} sx={{ p: 2.5, height: "100%" }}>
                <Typography variant="h3">{group.title}</Typography>
                <Box component="ul" sx={{ flex: 1, pl: 2.5, color: "text.secondary" }}>
                  {group.skills.map((skill) => (
                    <Typography key={skill} component="li" variant="body1">
                      {skill}
                    </Typography>
                  ))}
                </Box>
                <Stack spacing={1}>
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Box>
      </Section>
    </>
  );
}

export default function SkillsRoute({}: RoutePageProps) {
  return <SkillsPage />;
}
