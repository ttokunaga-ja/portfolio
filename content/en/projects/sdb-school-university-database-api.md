---
title: "sDB"
subtitle: "Education institution search and School / University Database API"
abstract: "An education institution search page and API that can reproduce a searchable database for high schools, universities, junior colleges, technical colleges, and vocational schools from official public government information. It supports autocomplete search by kanji, kana, katakana, and romanized terms."
role: "System design, data-processing scripts, API design, frontend implementation, and deployment"
period: "2026"
startDate: "2026-06-06"
endDate: "2026-06-07"
sortOrder: 10
featured: true
tags:
  - React
  - TypeScript
  - Go
  - PostgreSQL
  - Cloud Run
  - Cloudflare Pages
demoUrl: "https://sdb.takumi-tokunaga.com/"
links:
  demo:
    label: "Live page"
    url: "https://sdb.takumi-tokunaga.com/"
  api:
    label: "API docs"
    url: "https://sdb.takumi-tokunaga.com/api/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/sDB"
---

## Overview

sDB is a web page and API for searching Japanese education institutions. It is not limited to universities: it covers multiple institution types, including high schools, graduate schools, universities, junior colleges, technical colleges, advanced technical college programs, and vocational schools.

The main goal is reproducibility. The project is designed so that a searchable database can be rebuilt from official public government information in another environment, without depending on a specific external SaaS or a private-only dataset. The public repository includes data acquisition and processing scripts, the search frontend, and API documentation.

![sDB search form](sdb-search-form.jpg)

## Key Features

- Search across high schools, universities, junior colleges, technical colleges, vocational schools, and related institution types
- Step-by-step filtering by institution type, prefecture, institution, faculty or graduate school, and department
- Candidate search by kanji, kana, katakana, and romanized terms
- Lightweight autocomplete suggestions
- Public API access with API-key authentication
- Markdown-managed overview, API documentation, and notices pages

![Faculty autocomplete suggestions](sdb-autocomplete.png)

## Technical Stack

The frontend is built with React, TypeScript, Vite, and MUI, and is published on Cloudflare Pages. The API is implemented in Go and runs on Cloud Run. Neon PostgreSQL is used as the database.

Autocomplete uses `/v1/suggest`, separate from the list-oriented `/v1/institutions` endpoint. This keeps suggestion requests lightweight while preserving a richer endpoint for full institution search.

## Design Focus

The important part is not just holding a list of schools, but making the database reproducible from official public information. Separating data acquisition, normalization, search-term generation, API contracts, and the search UI makes it easier to update the source data and rebuild the same kind of database in another environment.

Institution names are also searched through generated terms, not only the original kanji names. The database includes kana, katakana, and romanized search terms so users can reach candidates through the spelling they naturally remember.

![Selected institution, faculty, and department](sdb-selection.png)

## Publishing and Operations

The public page is available at [https://sdb.takumi-tokunaga.com/](https://sdb.takumi-tokunaga.com/). API documentation is available at [https://sdb.takumi-tokunaga.com/api/](https://sdb.takumi-tokunaga.com/api/).

The public repository does not include raw source files, generated CSV files, database dumps, or secrets. It publishes the reproducible workflow and search surface while documenting attribution, processing, and disclaimers on the notices page.
