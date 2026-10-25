import { expect, test } from "@playwright/test";
import axe from "axe-core";

test("synced Zenn article renders usable footnotes after hydration", async ({ page }) => {
  await page.goto("/blog/");
  await page.locator('main a[href="/blog/2026-10-20-ai-support-accountability/"]').first().click();
  const article = page.locator(".markdown-article");
  const references = article.locator("a[data-footnote-ref]");
  expect(await references.count()).toBeGreaterThanOrEqual(3);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 1000 }
  ]) {
    await page.setViewportSize(viewport);
    const reference = references.first();
    const referenceId = await reference.getAttribute("id");
    const targetId = (await reference.getAttribute("href"))!.slice(1);
    await reference.click();
    await expect(page).toHaveURL(new RegExp(`#${targetId}$`));
    const footnote = article.locator(`[id="${targetId}"]`);
    await expect(footnote).toContainText("2026年10月");
    await footnote.locator(`a[href="#${referenceId}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${referenceId}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(() => window.axe.run(".markdown-article"));
  expect(results.violations).toEqual([]);
});
