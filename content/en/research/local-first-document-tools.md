---
title: "Privacy boundaries in local-first document tools"
subtitle: "How much PDF processing should stay in the browser"
abstract: "A design note on keeping PDF and image organization in the browser while routing only backend-dependent operations, such as Office conversion, through an explicit server-side path."
role: "Research, design, and PDF tool implementation"
period: "2026"
startDate: "2026-06-05"
endDate: "2026-06-07"
sortOrder: 20
featured: true
tags:
  - Local-first
  - PDF
  - Privacy
  - Cloudflare Workers
  - pdf.js
links:
  project:
    label: "securePDF"
    url: "https://securepdf.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/securePDF"
---

## Background

PDFs often contain contracts, school documents, internal materials, grades, or personal information. Many routine operations, such as merging, deletion, rotation, and reordering, do not inherently require a server.

This note records the design boundary between work that can stay in the browser and work that needs an explicit server-side path.

## Design Direction

- Keep normal PDF, JPEG, and PNG operations in the browser
- Route browser-unreliable work, such as Office conversion, through an authenticated backend
- Make it clear in the UI and documentation which operations send files outside the device
- Keep the Worker focused on light APIs and proxying, not file parsing
- Make PDF preview behavior close to Chrome PDF Viewer by respecting the source PDF's rotation and font resources

## Implementation

securePDF uses pdf.js for previewing and shared schema/core packages for PDF operations. The GUI, CLI, and API share one operation representation, which helps keep behavior consistent across surfaces.

Office conversion is treated as the exception and is routed through an API-key and daily-credit path. This keeps the distinction between local operations and server-side processing visible to users.

## Open Questions

Very large PDFs, unusual fonts, scanned PDFs, forms, and annotations still create constraints for browser-only processing. Preview quality, memory usage, processing time, and error reporting need continued improvement.
