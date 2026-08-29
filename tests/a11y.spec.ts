import { existsSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { expect, test } from "@playwright/test";
import axe from "axe-core";

declare global {
  interface Window {
    axe: typeof axe;
  }
}

const siteOrigin = (process.env.PORTFOLIO_SITE_ORIGIN ?? "https://takumi-tokunaga.com").replace(/\/+$/, "");

function expectedCanonical(path: string) {
  return `${siteOrigin}${path}`;
}

function collectPrerenderedPaths() {
  const distDir = join(process.cwd(), "dist");
  const paths = new Set<string>();

  if (!existsSync(distDir)) {
    return ["/"];
  }

  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(absolutePath);
      }

      if (entry.isFile() && entry.name === "index.html") {
        const routePath = relative(distDir, directory).split(sep).join("/");
        paths.add(routePath ? `/${routePath}/` : "/");
      }
    }
  };

  visit(distDir);
  paths.add("/404.html");

  return Array.from(paths).sort((left, right) => {
    if (left === right) return 0;
    if (left === "/") return -1;
    if (right === "/") return 1;
    return left.localeCompare(right);
  });
}

const markdownDetailPathPattern = /^\/(research|projects|experience|blog)\/[^/]+\/$/;
const contentGutterViewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "laptop", width: 1024, height: 900 }
];

test.describe("portfolio accessibility", () => {
  test("Containers retain the shared viewport gutter without page overflow", async ({ page }) => {
    test.setTimeout(240_000);

    for (const viewport of contentGutterViewports) {
      await page.setViewportSize(viewport);

      for (const path of collectPrerenderedPaths()) {
        await test.step(`${viewport.name} ${path}`, async () => {
          await page.goto(path);
          await expect(page.locator("main")).toBeVisible();

          const containerSelector =
            (await page.locator(".MuiContainer-root").count()) > 0 ? ".MuiContainer-root" : "main > section";
          const measurements = await page.locator(containerSelector).evaluateAll((containers) => {
            const viewportWidth = window.innerWidth;
            return {
              documentScrollWidth: document.documentElement.scrollWidth,
              viewportWidth,
              containers: containers.map((container) => {
                const bounds = container.getBoundingClientRect();
                return { left: bounds.left, right: viewportWidth - bounds.right };
              })
            };
          });

          expect(measurements.containers.length).toBeGreaterThan(0);
          expect(measurements.documentScrollWidth).toBeLessThanOrEqual(measurements.viewportWidth);

          const minimumGutter = measurements.viewportWidth * 0.05 - 1;
          for (const container of measurements.containers) {
            expect(container.left).toBeGreaterThanOrEqual(minimumGutter);
            expect(container.right).toBeGreaterThanOrEqual(minimumGutter);
          }
        });
      }
    }
  });

  test("all prerendered routes have no detectable a11y violations", async ({ page }) => {
    test.setTimeout(240_000);

    for (const path of collectPrerenderedPaths()) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        await page.addScriptTag({ content: axe.source });
        const results = await page.evaluate(async () => {
          return await window.axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"]
            },
            rules: {
              "color-contrast": { enabled: true }
            }
          });
        });

        expect(results.violations).toEqual([]);
      });
    }
  });

  test("markdown images expose intrinsic dimensions, alt text, and load successfully", async ({ page }) => {
    test.setTimeout(240_000);

    for (const path of collectPrerenderedPaths().filter((routePath) => markdownDetailPathPattern.test(routePath))) {
      await test.step(path, async () => {
        await page.goto(path);

        const images = page.locator(".markdown-article img");
        const imageCount = await images.count();
        for (let index = 0; index < imageCount; index += 1) {
          const image = images.nth(index);
          await image.scrollIntoViewIfNeeded();
          await expect
            .poll(() =>
              image.evaluate((element) => {
                const htmlImage = element as HTMLImageElement;
                return htmlImage.complete && htmlImage.naturalWidth > 0 && htmlImage.naturalHeight > 0;
              })
            )
            .toBe(true);
        }

        const imageIssues = await page.locator(".markdown-article img").evaluateAll((images) =>
          images
            .map((image) => {
              const htmlImage = image as HTMLImageElement;

              return {
                src: htmlImage.getAttribute("src") ?? "",
                alt: htmlImage.getAttribute("alt") ?? "",
                width: htmlImage.getAttribute("width") ?? "",
                height: htmlImage.getAttribute("height") ?? "",
                complete: htmlImage.complete,
                naturalWidth: htmlImage.naturalWidth,
                naturalHeight: htmlImage.naturalHeight
              };
            })
            .filter(
              (image) =>
                image.src &&
                (!image.alt.trim() ||
                  !/^\d+$/.test(image.width) ||
                  Number(image.width) <= 0 ||
                  !/^\d+$/.test(image.height) ||
                  Number(image.height) <= 0 ||
                  !image.complete ||
                  image.naturalWidth <= 0 ||
                  image.naturalHeight <= 0)
            )
        );

        expect(imageIssues).toEqual([]);
      });
    }
  });

  test("core routes hydrate without mismatch warnings", async ({ page }) => {
    const hydrationMessages: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      if (
        (message.type() === "error" || message.type() === "warning") &&
        /hydration|hydrated|did not match|server rendered/i.test(text)
      ) {
        hydrationMessages.push(text);
      }
    });
    page.on("pageerror", (error) => hydrationMessages.push(error.message));

    for (const path of ["/", "/experience/rione/", "/contact/", "/en/experience/rione/"]) {
      await test.step(path, async () => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
      });
    }

    expect(hydrationMessages).toEqual([]);
  });

  test("detail pages retain prerendered content and navigation when their detail chunk fails", async ({ page }) => {
    await page.route(/\/assets\/rione-[^/]+\.js(?:\?.*)?$/, (route) => route.abort("failed"));
    await page.goto("/experience/rione/");

    await expect(page.getByRole("heading", { level: 1, name: "Ri-one" })).toBeVisible();
    await expect(page.locator(".markdown-article")).toContainText("RoboCupに向けたロボット開発");

    await page.getByRole("button", { name: "メニューを開く" }).click();
    await expect(page.getByRole("navigation", { name: "サイトナビゲーション" })).toBeVisible();
  });

  test("pre-rendered detail page exposes route-specific metadata before hydration", async ({ request }) => {
    const response = await request.get("/experience/ritsumeikan-university/");
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(html).toContain("<title>立命館大学 | Takumi Tokunaga</title>");
    expect(html).toContain(
      '<meta name="description" content="立命館大学 情報理工学部 情報理工学科に在学しています。2027年3月に卒業予定です。" />'
    );
    expect(html).toContain('<meta property="og:title" content="立命館大学 | Takumi Tokunaga" />');
    expect(html).toContain('<meta property="og:type" content="article" />');
    expect(html).toContain(
      `<link rel="canonical" href="${expectedCanonical("/experience/ritsumeikan-university/")}" />`
    );
    expect(html).toMatch(/<h1 class="[^"]*">立命館大学<\/h1>/);
    expect(html).not.toContain("AI systems, XR");
    expect(html).not.toContain("Knowledge Infrastructure");
  });

  test("article details expose generated contents anchors and Zenn directives", async ({ request }) => {
    const articleResponse = await request.get("/blog/2026-08-02-switch-before-router-network-incident/");
    expect(articleResponse.ok()).toBeTruthy();

    const articleHtml = await articleResponse.text();
    expect(articleHtml).toContain('id="heading-');
    expect(articleHtml).toContain('aria-label="スイッチングハブをルーターの手前に置いた反省');

    const detailsResponse = await request.get("/blog/2026-02-16-lab-git-branch-naming-rules/");
    expect(detailsResponse.ok()).toBeTruthy();

    const detailsHtml = await detailsResponse.text();
    expect(detailsHtml).toContain('<details class="markdown-details">');
    expect(detailsHtml).toContain("<summary>参考文献</summary>");
    expect(detailsHtml).not.toContain(":::details");
  });

  test("wide article tables are focusable, labelled scroll regions", async ({ page, request }) => {
    const path = "/blog/2026-08-01-ai-model-stack-cost-breakdown-2026-07/";
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(html).toContain('class="markdown-table-scroll"');
    expect(html).toContain(
      'role="region" aria-label="横にスクロール可能な表: 利用形態, サービス, この記事での扱い, 支出（税抜）" tabindex="0"'
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    const tableScrollRegion = page
      .getByRole("region", { name: "横にスクロール可能な表: 利用形態, サービス, この記事での扱い, 支出（税抜）" })
      .first();
    await expect(tableScrollRegion).toBeVisible();
    const { clientWidth, scrollWidth } = await tableScrollRegion.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    await tableScrollRegion.focus();
    await expect(tableScrollRegion).toBeFocused();
  });

  test("article table of contents remains in the side rail on laptop widths", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/blog/2026-08-02-switch-before-router-network-incident/");

    const article = page.locator(".markdown-article");
    const contents = page.getByRole("navigation", { name: "目次" });
    await expect(article).toBeVisible();
    await expect(contents).toBeVisible();

    const [articleBox, contentsBox] = await Promise.all([article.boundingBox(), contents.boundingBox()]);
    expect(articleBox).not.toBeNull();
    expect(contentsBox).not.toBeNull();
    expect(contentsBox!.x).toBeGreaterThan(articleBox!.x + articleBox!.width);
    await expect(page.getByText("著者", { exact: true })).toHaveCount(0);
  });

  test("home page keeps personal search terms in source-only metadata", async ({ request, page }) => {
    const response = await request.get("/");
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(html).toContain("<title>徳永拓未 | Takumi Tokunaga Portfolio</title>");
    expect(html).toContain('name="keywords"');
    expect(html).toContain("德永拓未");
    expect(html).toContain("德永");
    expect(html).toContain("拓未");
    expect(html).toContain("とくながたくみ");
    expect(html).toContain("とくなが");
    expect(html).toContain("たくみ");
    expect(html).toContain("トクナガタクミ");
    expect(html).toContain("トクナガ");
    expect(html).toContain("タクミ");
    expect(html).toContain("Tokunaga Takumi");
    expect(html).toMatch(/<h1 class="[^"]*">Takumi Tokunaga<\/h1>/);

    await page.goto("/");
    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toContain("徳永拓未");
    expect(visibleText).not.toContain("德永拓未");
    expect(visibleText).not.toContain("とくながたくみ");
    expect(visibleText).not.toContain("トクナガタクミ");
    expect(visibleText).not.toContain("德永");
    expect(visibleText).not.toContain("拓未");
  });

  test("head includes browser color and social metadata", async ({ page }) => {
    await page.goto("/experience/ritsumeikan-university/");

    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute("content", "light dark");
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/images/logo.png");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "立命館大学 | Takumi Tokunaga");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://takumi-tokunaga.com/images/og-image.png"
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      expectedCanonical("/experience/ritsumeikan-university/")
    );

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    const graph = JSON.parse(jsonLd ?? "{}")["@graph"] as Array<{ "@type": string; alternateName?: string[] }>;
    const person = graph.find((node) => node["@type"] === "Person");
    expect(person).toBeTruthy();
    expect(person?.alternateName).toEqual(expect.arrayContaining(["Tokunaga Takumi", "徳永拓未", "德永拓未"]));
    expect(graph.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("skip link and drawer are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "本文へ移動" });
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();

    const menuButton = page.getByRole("button", { name: "メニューを開く" });
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).not.toHaveAttribute("aria-controls");
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('button[aria-label="メニューを開く"]')).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('button[aria-label="メニューを開く"]')).toHaveAttribute(
      "aria-controls",
      "site-navigation"
    );
    await expect(page.getByRole("navigation", { name: "サイトナビゲーション" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menuButton).toBeFocused();
  });

  test("active navigation links expose localized landmarks and current-page semantics", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/experience/");

    const primaryNavigation = page.getByRole("navigation", { name: "主要ナビゲーション" }).first();
    await expect(primaryNavigation.getByRole("link", { name: "Experience" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "メニューを開く" }).click();
    const drawerNavigation = page.getByRole("navigation", { name: "サイトナビゲーション" });
    await expect(drawerNavigation.getByRole("link", { name: "Experience" })).toHaveAttribute("aria-current", "page");

    await page.goto("/en/experience/");
    await expect(page.getByRole("navigation", { name: "Primary navigation" }).first()).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }).first().getByRole("link", { name: "Experience" })
    ).toHaveAttribute("aria-current", "page");
  });

  test("not-found pages keep Home out of the current-page state in both locales", async ({ page }) => {
    for (const [path, menuName, navigationName] of [
      ["/not-found/", "メニューを開く", "サイトナビゲーション"],
      ["/en/not-found/", "Open Menu", "Site navigation"]
    ]) {
      await test.step(path, async () => {
        await page.goto(path);
        await page.getByRole("button", { name: menuName }).click();
        const home = page.getByRole("navigation", { name: navigationName }).getByRole("link", { name: "Home" });
        await expect(home).not.toHaveAttribute("aria-current");
      });
    }
  });

  test("mobile Contact keeps the document at its horizontal origin", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contact/");

    const viewport = await page.evaluate(() => ({
      scrollX: window.scrollX,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    }));

    expect(viewport.scrollX).toBe(0);
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.innerWidth);
  });

  test("visible header targets meet 44px touch target", async ({ page }) => {
    await page.goto("/");

    const boxes = await page.locator("header a, header button").evaluateAll((targets) =>
      targets
        .filter((target) => {
          const rect = target.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((target) => {
          const rect = target.getBoundingClientRect();
          return {
            text: target.textContent?.trim() || target.getAttribute("aria-label") || target.getAttribute("href") || "",
            width: rect.width,
            height: rect.height
          };
        })
    );

    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.width, `${box.text} width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${box.text} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
