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

const markdownDetailPathPattern = /^\/(research|projects|experience)\/[^/]+\/$/;

test.describe("portfolio accessibility", () => {
  test("all prerendered routes have no detectable a11y violations", async ({ page }) => {
    test.setTimeout(90_000);

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

  test("markdown images expose alt text and load successfully", async ({ page }) => {
    for (const path of collectPrerenderedPaths().filter((routePath) => markdownDetailPathPattern.test(routePath))) {
      await test.step(path, async () => {
        await page.goto(path);

        const images = page.locator(".markdown-article img");
        const imageCount = await images.count();
        for (let index = 0; index < imageCount; index += 1) {
          await images.nth(index).scrollIntoViewIfNeeded();
        }
        await page.waitForFunction(() =>
          Array.from(document.querySelectorAll<HTMLImageElement>(".markdown-article img")).every(
            (image) => !image.currentSrc || (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)
          )
        );

        const imageIssues = await page.locator(".markdown-article img").evaluateAll((images) =>
          images
            .map((image) => {
              const htmlImage = image as HTMLImageElement;

              return {
                src: htmlImage.getAttribute("src") ?? "",
                alt: htmlImage.getAttribute("alt") ?? "",
                complete: htmlImage.complete,
                naturalWidth: htmlImage.naturalWidth,
                naturalHeight: htmlImage.naturalHeight
              };
            })
            .filter(
              (image) =>
                image.src &&
                (!image.alt.trim() || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0)
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

    for (const path of ["/", "/experience/rione/", "/contact/"]) {
      await test.step(path, async () => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
      });
    }

    expect(hydrationMessages).toEqual([]);
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

  test("head includes browser color and social metadata", async ({ page }) => {
    await page.goto("/experience/ritsumeikan-university/");

    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute("content", "light dark");
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/images/logo.png");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "立命館大学 | Takumi Tokunaga");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://takumi-tokunaga.com/images/logo.png"
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary");
  });

  test("skip link and drawer are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "本文へ移動" });
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();

    const menuButton = page.getByRole("button", { name: "メニューを開く" });
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: "Home" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menuButton).toBeFocused();
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
