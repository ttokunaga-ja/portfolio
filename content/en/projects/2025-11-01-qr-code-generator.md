---
title: "QR Code Generator"
subtitle: "A browser-only QR code generator"
abstract: "A client-side QR code generator for Wi-Fi, URL, and text QR codes, built with React, TypeScript, and MUI. It is deployed on Cloudflare Pages and is available as a free, unlimited-use public tool."
role: "Design, frontend implementation, and deployment"
period: "2025 - 2026"
startDate: "2025-11-01"
endDate: "2026-06-05"
updatedAt: "2025-11-01"
sortOrder: 20
featured: true
tags:
  - React
  - TypeScript
  - MUI
  - Cloudflare Pages
  - Security
demoUrl: "https://qr.takumi-tokunaga.com/"
links:
  demo:
    label: "Live site"
    url: "https://qr.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/QR_Code_Generator"
---

## Overview

QR Code Generator is a web tool for creating Wi-Fi, URL, and text QR codes. The flow from input to preview and PNG download runs in the browser, so the app does not need to hand user input to an external API.

The public site is hosted on Cloudflare Pages with the custom domain [https://qr.takumi-tokunaga.com/](https://qr.takumi-tokunaga.com/).

## Key Features

- QR code generation for Wi-Fi, URLs, and text
- Live preview as the input changes
- Download support for generated QR codes
- Japanese and English language switching
- Light and dark appearance that follows the OS or browser theme
- Security policy and FAQ pages
- Centered advertising spaces at the top and bottom of the page

## Technical Stack

The frontend is built with React, TypeScript, Vite, and MUI. QR codes are generated with `qrcode` and rendered directly to a Canvas element. i18next is used for bilingual UI text, policy content, and FAQ content.

Deployment uses Cloudflare Pages. Updates to the GitHub `main` branch trigger a static build and publish flow.

## Design Focus

The input form and QR preview are kept on the same screen so users can confirm the result immediately. The header provides access to language switching, the security policy, and the FAQ. The FAQ also states that the tool is free to use and has no usage limit.

The UI is assembled around MUI components, with rounded cards, responsive layout behavior, and color schemes that follow the user's system theme. The goal is a page that feels natural on both mobile and desktop.

## Publishing and Operations

The built assets are served as a static site on Cloudflare Pages. Because QR generation does not require server-side processing, the production setup is simple to operate and users can access the tool without signing up.
