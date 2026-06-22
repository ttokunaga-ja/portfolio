---
title: "Reproducible design for education institution search"
subtitle: "Implementation notes for turning official public data into a search experience"
abstract: "Notes on separating data acquisition, normalization, search-term generation, autocomplete APIs, and UI display when building searchable data for high schools, universities, junior colleges, technical colleges, and vocational schools."
role: "Research, data design, and search UI evaluation"
period: "2026"
startDate: "2026-06-06"
endDate: "2026-06-07"
sortOrder: 10
featured: true
tags:
  - Education Data
  - Search
  - PostgreSQL
  - Go
  - Cloud Run
links:
  project:
    label: "sDB project"
    url: "https://sdb.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/sDB"
---

## Background

Institution names are entered in many ways: kanji, kana, katakana, romanized text, abbreviations, and partial names. Exact-match search is often too brittle because a user may remember a spelling that differs from the source data.

This note organizes how public education data can be transformed into a structure that is useful in a real search UI.

## Design Points

- Separate source-data acquisition from generated search data
- Filter step by step by institution type, prefecture, institution, faculty or graduate school, and department
- Generate search terms in kana, katakana, and romanized forms in addition to kanji
- Split list search and autocomplete into separate endpoints to keep typing-time requests light
- Publish notes on source data, processing scope, and disclaimers

## Implementation

The ideas are reflected in the sDB search page and API. The API is implemented in Go with PostgreSQL, the frontend is published on Cloudflare Pages, and the backend runs on Cloud Run.

The public repository does not include secrets or private data. It focuses on the reproducible processing workflow and the user-facing search surface.

## Open Questions

Handling name variants, update cadence, source-diff detection, and explainable search results remain active areas for improvement. Education institution names change through reorganizations and policy changes, so the important part is not only building a database, but making the update pipeline maintainable.
