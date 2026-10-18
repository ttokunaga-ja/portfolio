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
  const research = hrefFor({ collection: "research", slug: "handslap-race" }, locale);
  const groups = [
    {
      title: "Rust / CLI",
      description: ja
        ? "保存・索引・検索を分離したローカル知識アーカイブとCLIの開発。"
        : "Local knowledge archives and CLI development, with separate storage, indexing, and search components.",
      links: [{ label: "Kio", href: hrefFor({ collection: "projects", slug: "kio" }, locale) }]
    },
    {
      title: "Go / Backend",
      description: ja
        ? "教育機関検索APIの実装。検索候補と一覧検索を分離し、PostgreSQLと組み合わせています。"
        : "Educational-institution search APIs with separate suggestion and search endpoints, backed by PostgreSQL.",
      links: [{ label: "sDB", href: sdb }]
    },
    {
      title: "Unity / C# / MR",
      description: ja
        ? "QR追跡を利用したMR実装。研究ではUnity開発の実装・進捗確認・品質保証を担当しました。"
        : "MR development using QR tracking. My research work also included Unity implementation, progress tracking, and QA.",
      links: [
        { label: "Group4_MoleWhack", href: "https://github.com/ttokunaga-ja/Group4_MoleWhack" },
        {
          label: ja ? "QR追跡と配置の技術記事" : "QR tracking and placement (Japanese)",
          href: "https://zenn.dev/t_tokunaga/articles/2025-12-02-unity-quest3s-qrcode-detection"
        },
        { label: "HandSlapRace", href: research }
      ]
    },
    {
      title: "TypeScript / React / Three.js",
      description: ja
        ? "Webツール、検索UI、ブラウザ上の3Dコンテンツの開発。"
        : "Web utilities, search interfaces, and browser-based 3D content.",
      links: [
        { label: "sDB", href: sdb },
        {
          label: "3D Maze Game",
          href: hrefFor({ collection: "projects", slug: "2026-06-07-threejs-3d-maze-game" }, locale)
        },
        { label: t("nav.projects"), href: hrefFor("projects", locale) }
      ]
    },
    {
      title: "Python / Data",
      description: ja
        ? "公開資料の取得・正規化と検索用データの生成。"
        : "Acquisition and normalization of public data for search.",
      links: [
        { label: "sDB", href: sdb },
        { label: ja ? "sDB 公開リポジトリ" : "sDB repository", href: "https://github.com/ttokunaga-ja/sDB" }
      ]
    },
    {
      title: "Quality / Delivery",
      description: ja
        ? "研究開発での進捗確認・品質保証と、Webサイトの自動検査。"
        : "Progress tracking and quality assurance in research development, plus automated checks for web projects.",
      links: [
        { label: "HandSlapRace", href: research },
        { label: "portfolio", href: "https://github.com/ttokunaga-ja/portfolio" }
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
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  {group.description}
                </Typography>
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
