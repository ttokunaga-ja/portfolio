import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Section, usePageLocale } from "../pagePrimitives";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";

function AboutPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const sections =
    locale === "ja"
      ? [
          {
            title: "運営者",
            body: "徳永拓未 / Takumi Tokunaga が運営する個人サイトです。研究関心、個人開発プロジェクト、職務・学習経験を、公開できる範囲で継続的に整理しています。"
          },
          {
            title: "公開している内容",
            body: "教育データ検索、local-firstなPDF処理、QRコード生成、3Dブラウザゲームなど、自分で設計・実装・公開した成果物を中心に掲載しています。各プロジェクトページでは、目的、主な機能、技術構成、設計で重視した点、公開・運用方法を分けて説明しています。"
          },
          {
            title: "編集方針",
            body: "内容は、実装したリポジトリ、公開ページ、運用メモ、学習・活動履歴をもとに更新します。外部資料を参照する場合は、単なる転載ではなく、自分の実装や検証にどう関係するかを明確にします。"
          },
          {
            title: "連絡先",
            body: "不具合報告、掲載内容の訂正、API利用、共同開発などの連絡は Contact ページから受け付けています。"
          }
        ]
      : [
          {
            title: "Operator",
            body: "This is the personal website of Takumi Tokunaga. It documents research interests, independent software projects, and learning or work experience within the scope that can be published."
          },
          {
            title: "Published scope",
            body: "The site focuses on work I designed, implemented, and published myself, including education-data search, local-first PDF processing, QR code generation, and a browser-based 3D game. Project pages separate purpose, key features, stack choices, design focus, and operations."
          },
          {
            title: "Editorial policy",
            body: "Content is updated from implemented repositories, public pages, operation notes, and activity history. When external references are used, the page explains how they relate to my own implementation or evaluation."
          },
          {
            title: "Contact",
            body: "Bug reports, corrections, API access questions, and collaboration requests are accepted through the Contact page."
          }
        ];

  return (
    <>
      <PageHead icon={<InfoRoundedIcon />} title={t("page.aboutTitle")} lead={t("page.aboutLead")} />
      <Section title={t("page.aboutTitle")} lead={t("page.aboutLead")}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2.5
          }}
        >
          {sections.map((section) => (
            <Card key={section.title} variant="outlined">
              <Stack spacing={1.4} sx={{ p: 2.5 }}>
                <Typography variant="h3">{section.title}</Typography>
                <Typography color="text.secondary">{section.body}</Typography>
              </Stack>
            </Card>
          ))}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 3 }}>
          <Button href={hrefFor("projects", locale)} variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
            {t("nav.projects")}
          </Button>
          <Button href={hrefFor("contact", locale)} variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
            {t("nav.contact")}
          </Button>
        </Stack>
      </Section>
    </>
  );
}

export default function AboutRoute({ route, locale, entryDetail }: RoutePageProps) {
  return <AboutPage />;
}
