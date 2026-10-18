import { expect, test } from "@playwright/test";

for (const locale of ["ja", "en"] as const) {
  const prefix = locale === "ja" ? "" : "/en";
  test(`${locale}: work states, education plans, and local navigation survive hydration`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    const main = page.locator("main");
    const updates = main.getByRole("list", { name: locale === "ja" ? "最新の更新" : "Latest updates" });
    await expect(updates.locator("article")).toHaveCount(3);
    const dates = await updates
      .locator("time")
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("datetime") || ""));
    expect(dates).toEqual([...dates].sort().reverse());
    await expect(main.locator('a[href$="/experience/"]')).toHaveCount(0);
    for (const collection of ["research", "projects", "blog"]) {
      await expect(updates.locator(`a[href*="/${collection}/"]`)).toHaveCount(1);
    }

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 1000 }
    ]) {
      await page.setViewportSize(viewport);
      for (const path of [
        "/",
        "/about/",
        "/skills/",
        "/projects/",
        "/projects/kio/",
        "/research/handslap-race/",
        "/experience/"
      ]) {
        await page.goto(`${prefix}${path}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await expect(page.locator("h1")).toHaveCount(1);
      }
    }
    await page.goto(`${prefix}/projects/kio/`);
    await expect(main).toContainText(locale === "ja" ? "開発中" : "In development");
    await expect(main.getByRole("link", { name: locale === "ja" ? /体験する/ : /open demo/i })).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://takumi-tokunaga.com${prefix}/projects/kio/`
    );

    await page.goto(`${prefix}/experience/ritsumeikan-university/`);
    await expect(main).toContainText(locale === "ja" ? "卒業予定" : "expected");
    await page.goto(`${prefix}/experience/ritsumeikan-graduate-planned/`);
    await expect(main).toContainText(locale === "ja" ? "入学予定" : /plan/i);
    await expect(main).toContainText("2029");
    await expect(main).toContainText(locale === "ja" ? "修了予定" : /expected/i);
    await page.goto(`${prefix}/contact/`);
    await expect(main.getByRole("link", { name: /Instagram/ })).toHaveAttribute(
      "href",
      "https://www.instagram.com/takumi_tokunaga/"
    );
    await expect(main.getByRole("link", { name: /Instagram/ })).toHaveAttribute("rel", "noreferrer");
  });
}
