---
title: "claudeHistory"
subtitle: "Add missing Claude Desktop Code history across accounts"
abstract: "A Rust CLI that adds missing local Code conversation listings across Claude Desktop accounts and organizations on the same computer. It preserves original registrations and backups, with dry-run inspection and undo."
updatedAt: "2026-10-15"
sortOrder: 2
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Claude Desktop"
  - "Local-first"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/claudeHistory"
  release:
    label: "Latest release"
    url: "https://github.com/ttokunaga-ja/claudeHistory/releases/latest"
  article:
    label: "Article (Japanese, Zenn)"
    url: "https://zenn.dev/t_tokunaga/articles/2026-10-07-claude-history-cli"
---

## Overview

claudeHistory is an unofficial CLI for making existing local Code conversations visible after switching Claude Desktop accounts on the same computer. Written in Rust, it is distributed for Apple Silicon macOS and Windows x64.

## Main Functions

- Discover accounts and organizations and add missing conversation registrations to their lists
- Preview additions with `sync --dry-run` without changing history or stopping applications
- Transfer registrations to the current account or undo additions using a saved backup
- Preserve existing IDs and refuse conflicting conversation references or working directories before writing

## Design and Usage Boundaries

The tool adds listing metadata while retaining references to conversation bodies already stored on the computer. Original registrations and recovery backups are preserved. Authentication, MCP connections, previous execution permissions, and scheduled settings are not migrated.

Regular chats, Cowork, cloud history, and deleted conversation bodies are outside its scope. Local processing does not upload conversations, but sending a later message from a restored listing sends its context to Claude under the logged-in account. Use it only between accounts you own and are authorized to transfer between.
