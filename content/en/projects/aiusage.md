---
title: "aiUsage"
subtitle: "Model-level token usage from local logs to CSV"
abstract: "A Rust CLI that summarizes Claude Code and Codex logs into usage.csv, including model-level input, cache, output tokens, and API reference costs. It supports date filters and daily, monthly, or yearly grouping while preserving source logs."
updatedAt: "2026-10-10"
sortOrder: 3
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Claude Code"
  - "Codex"
  - "CSV"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/aiUsage"
  release:
    label: "Latest release"
    url: "https://github.com/ttokunaga-ja/aiUsage/releases/latest"
  article:
    label: "Article (Japanese, Zenn)"
    url: "https://zenn.dev/t_tokunaga/articles/2026-10-04-aiusage-cli"
---

## Overview

aiUsage turns local Claude Code and Codex usage records into model-level CSV summaries. It replaces repeated manual log inspection with a command that selects a period and exports the result. Binaries are available for macOS and Windows x64; Linux users can build from source.

## Main Functions

- Select a date range and aggregate totals or daily, monthly, and yearly results
- Separate normal input, cache reads, cache writes, and output tokens by model
- Calculate API reference costs in USD using a bundled price table
- Write `usage.csv` in the current directory, requesting confirmation before replacement

## Design and Usage Boundaries

Normal aggregation stays local, requires no API key, and leaves logs, settings, and databases unchanged. Conversation text is excluded from CSV. Deduplication and cumulative-counter handling help avoid counting repeated records twice.

Reference costs compare token usage at bundled rates; they are neither historical invoices nor subscription charges. Unknown pricing produces a blank cost and a warning. Deleted logs are not reconstructed, so results cover the valid records still available.
