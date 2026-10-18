---
title: "aiClean"
subtitle: "Local history cleanup based on the last real message"
abstract: "A Rust CLI that moves older local Claude Code and Codex conversations to the OS Trash based on their last real message. It provides inspection, opt-in monthly cleanup, recovery records, and restore commands without handling cloud history."
updatedAt: "2026-10-10"
sortOrder: 1
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Claude Code"
  - "Codex"
  - "Local-first"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/aiClean"
  release:
    label: "Latest release"
    url: "https://github.com/ttokunaga-ja/aiClean/releases/latest"
  article:
    label: "Article (Japanese, Zenn)"
    url: "https://zenn.dev/t_tokunaga/articles/2026-10-09-aiclean-cli"
---

## Overview

aiClean organizes local Claude Code and Codex storage. It determines age from user sends and completed assistant messages, rather than filesystem modification dates. Conversations whose last real message predates the current month can become cleanup candidates. Releases are available for macOS and Windows x64.

## Main Functions

- Inspect candidates, message dates, and source bytes with the read-only `check` command
- Enable monthly cleanup explicitly, inspect it with `status`, and disable it with `stop`
- Verify and record original files and database rows before moving recovery bundles to native OS Trash
- Restore the latest or a selected batch with `undo`, including recovery from interrupted operations

## Design and Usage Boundaries

Unknown dates, unfinished work, active goals, and unsafe session relationships are skipped. Installation alone does not enable cleanup. The scope is local Claude Code and Codex data; cloud ChatGPT history is excluded.

Trash disposal remains under OS control, so moving data does not immediately reclaim disk space. Restore requires the recovery bundle to remain available and refuses to overwrite conflicting existing data.
