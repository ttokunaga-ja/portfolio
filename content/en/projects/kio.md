---
title: "Kio"
subtitle: "A local knowledge archive built in Rust — In development / CLI pre-release"
abstract: "A Rust-based knowledge archive in development / CLI pre-release. Originals, history, and indexes stay local, with search results connected to source evidence. Using external AI for OCR or embeddings requires explicit opt-in."
sortOrder: 5
featured: true
tags:
  - Rust
  - CLI
  - SQLite
  - CAS
  - Local-first
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/kio"
  release:
    label: "CLI pre-release"
    url: "https://github.com/ttokunaga-ja/kio/releases/tag/v0.1.0-rc.3"
---

## Overview

Kio is a local-first archive for working with personal documents over time. It is built in Rust and is currently in development / CLI pre-release.

## Core design

Its core design combines content-addressed storage with Evidence Pointers that connect results to retained versions and locations in source material. Originals, history, and indexes stay local. The Rust workspace separates the CLI, storage, indexing, search, and ingestion pipeline.

Network transmission is disabled by default; using external AI for OCR or embeddings requires explicit permission for the relevant scope.

## Current status

There is no GUI, and v1 acceptance testing is ongoing. Resolving past evidence requires the necessary history to be retained and permitted by the current policy. The development work on main described here is not a guarantee of the published RC's capabilities. The README distinguishes development work from the published release.

[Public code and README](https://github.com/ttokunaga-ja/kio) / [CLI pre-release](https://github.com/ttokunaga-ja/kio/releases/tag/v0.1.0-rc.3)
