---
title: "securePDF"
subtitle: "A local-first PDF organization tool that runs in the browser"
abstract: "A PDF tool that keeps basic PDF, JPEG, and PNG organization in the browser while routing Office-to-PDF conversion through an authenticated backend. It includes a Chrome PDF Viewer-like preview, page reordering, rotation, flipping, deletion, insertion markers, a CLI, and an HTTP API."
role: "System design, PDF engine implementation, frontend implementation, Worker/API design, CLI implementation, and deployment"
period: "2026"
startDate: "2026-06-05"
endDate: "2026-06-07"
updatedAt: "2026-06-07"
sortOrder: 12
featured: true
tags:
  - React
  - TypeScript
  - Cloudflare Workers
  - Cloud Run
  - PDF
  - Security
demoUrl: "https://securepdf.takumi-tokunaga.com/"
links:
  demo:
    label: "Live page"
    url: "https://securepdf.takumi-tokunaga.com/"
  api:
    label: "API docs"
    url: "https://securepdf.takumi-tokunaga.com/docs/api/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/securePDF"
---

## Overview

securePDF is a local-first PDF tool for merging, reordering, rotating, flipping, deleting, and converting images to PDF. Normal PDF, JPEG, and PNG operations run in the browser. Server-side work is reserved for operations that cannot realistically run in the browser, such as Office-to-PDF conversion.

The public version is available at [https://securepdf.takumi-tokunaga.com/](https://securepdf.takumi-tokunaga.com/).

## Key Features

- Import PDF, JPEG, and PNG files
- Convert JPEG / PNG files to PDF
- Reorder, rotate, flip, and delete pages
- Merge, print, and download PDFs
- Continuous preview behavior similar to Chrome PDF Viewer
- Visible insertion position in the preview
- Convert Office files such as docx, xlsx, and pptx to PDF
- Shared operation schema across the GUI, CLI, and HTTP API

## Technical Stack

The frontend is built with React, TypeScript, Vite, and MUI. PDF preview uses pdf.js. The PDF operation contract is split into `@securepdf/schema` and `@securepdf/core`, so the GUI, CLI, and Cloud Run-side processing can share the same operation schema and engine.

The public site is served as a Cloudflare Worker with Static Assets. The Worker does not parse PDF bytes. It stays focused on light endpoints such as `capabilities`, `openapi.json`, and `validate-plan`, plus proxying heavy work to Cloud Run or the Office conversion backend.

## Design Focus

PDFs often contain contracts, school documents, grades, internal materials, and other files that should not be uploaded casually. If the user only needs to rotate a few pages, remove unnecessary pages, or merge PDFs, the file does not need to leave the device.

The design therefore keeps browser-capable work local and makes backend-dependent work explicit. Office conversion uses a separate authenticated path with API keys and credits, so the boundary between local and server-side processing remains visible.

## Publishing and Operations

The public version is hosted on Cloudflare. Normal PDF organization runs in the browser, while heavy operations and Office conversion are proxied by the Worker to Cloud Run or a conversion backend.

The project also includes a CLI. It can run rotation, deletion, extraction, flipping, reordering, PDF/image insertion, splitting, image-to-PDF conversion, and Office conversion from the command line.
