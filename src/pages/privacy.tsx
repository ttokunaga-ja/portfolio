import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import { Box, Button, Card, Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { PageHead, Section, usePageLocale } from "../pagePrimitives";
import { hrefFor } from "../routeLinks";
import type { RoutePageProps } from "../routePageTypes";

function PrivacyPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const updatedLabel = locale === "ja" ? "最終更新: 2026年6月22日" : "Last updated: June 22, 2026";
  const policies =
    locale === "ja"
      ? [
          {
            title: "基本方針",
            body: "このサイトは、運営者の活動、研究、個人開発プロジェクトを紹介するために公開しています。必要以上の個人情報を収集しないこと、利用者が問い合わせや外部サービス利用の範囲を理解できることを重視します。"
          },
          {
            title: "アクセス解析とログ",
            body: "ホスティング、CDN、認証、API提供のため、Cloudflare、Firebase、Google Cloud などの外部サービスが標準的なアクセスログや技術情報を処理する場合があります。これらは不正利用対策、障害調査、品質改善のために使います。"
          },
          {
            title: "広告について",
            body: "このサイトでは Google AdSense などの広告配信サービスを利用する場合があります。広告配信事業者は Cookie や類似技術を使い、利用者の過去のアクセス情報に基づいて広告を表示することがあります。広告のパーソナライズ設定は Google の広告設定から変更できます。"
          },
          {
            title: "問い合わせ",
            body: "メール、GitHub、LinkedIn などから送られた内容は、返信、本人確認、依頼内容の確認、トラブル対応のために利用します。法令上必要な場合を除き、問い合わせ内容を第三者に販売することはありません。"
          },
          {
            title: "外部リンク",
            body: "このサイトには、GitHub、Zenn、LinkedIn、公開プロジェクト、APIドキュメントなど外部サイトへのリンクがあります。外部サイトでの情報の取り扱いは、それぞれの運営者のポリシーをご確認ください。"
          },
          {
            title: "改定",
            body: "この方針は、サイト構成、利用サービス、法令やポリシーの変更に合わせて更新することがあります。重要な変更がある場合は、このページの内容を更新します。"
          }
        ]
      : [
          {
            title: "Basic policy",
            body: "This site introduces the operator's activity, research, and independent software projects. It avoids collecting unnecessary personal information and explains the scope of contact channels and external services."
          },
          {
            title: "Analytics and logs",
            body: "Hosting, CDN, authentication, and API services such as Cloudflare, Firebase, and Google Cloud may process standard access logs and technical information. This is used for abuse prevention, troubleshooting, and quality improvement."
          },
          {
            title: "Advertising",
            body: "This site may use advertising services such as Google AdSense. Advertising providers may use cookies or similar technologies to show ads based on previous access information. Ad personalization can be managed through Google's ad settings."
          },
          {
            title: "Contact",
            body: "Messages sent by email, GitHub, LinkedIn, or other channels are used to reply, verify the sender, understand the request, and handle troubleshooting. Contact content is not sold to third parties unless required by law."
          },
          {
            title: "External links",
            body: "This site links to external services such as GitHub, Zenn, LinkedIn, public projects, and API documentation. Please check each external service's own policy for how it handles information."
          },
          {
            title: "Updates",
            body: "This policy may be updated when the site structure, services, laws, or platform policies change. Important changes are reflected on this page."
          }
        ];

  return (
    <>
      <PageHead icon={<PrivacyTipRoundedIcon />} title={t("page.privacyTitle")} lead={t("page.privacyLead")} />
      <Section title={t("page.privacyTitle")} lead={updatedLabel}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2.5
          }}
        >
          {policies.map((policy) => (
            <Card key={policy.title} variant="outlined">
              <Stack spacing={1.4} sx={{ p: 2.5 }}>
                <Typography variant="h3">{policy.title}</Typography>
                <Typography color="text.secondary">{policy.body}</Typography>
              </Stack>
            </Card>
          ))}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 3 }}>
          <Button href={hrefFor("contact", locale)} variant="contained" endIcon={<ArrowForwardRoundedIcon />}>
            {t("nav.contact")}
          </Button>
          <Button href={hrefFor("about", locale)} variant="outlined" endIcon={<ArrowForwardRoundedIcon />}>
            {t("nav.about")}
          </Button>
        </Stack>
      </Section>
    </>
  );
}

export default function PrivacyRoute({ route, locale, entryDetail }: RoutePageProps) {
  return <PrivacyPage />;
}
