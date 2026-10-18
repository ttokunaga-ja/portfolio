---
title: "codexSwitch"
subtitle: "Launch a separate Codex instance for another provider"
abstract: "An unofficial Rust CLI that starts a second Codex app instance for OpenRouter or Z.ai Coding Plan using independent CODEX_HOME and application data. It preserves the main ChatGPT configuration and supports setup, status inspection, and conversation handoff."
updatedAt: "2026-10-03"
sortOrder: 4
featured: true
tags:
  - "Rust"
  - "CLI"
  - "Codex"
  - "OpenRouter"
  - "Z.ai"
links:
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/codexSwitch"
  release:
    label: "Latest release"
    url: "https://github.com/ttokunaga-ja/codexSwitch/releases/latest"
  article:
    label: "Article (Japanese, Zenn)"
    url: "https://zenn.dev/t_tokunaga/articles/2026-09-22-codex-switch-openrouter"
---

## Overview

codexSwitch starts a second Codex desktop instance for OpenRouter or Z.ai Coding Plan alongside the main app. This unofficial Rust CLI supports macOS and Windows and is not endorsed by OpenAI.

## Main Functions

- Prepare dedicated settings and model catalogs with `init`, including API key placement guidance
- Launch a selected provider and inspect configuration and instance state with `status`
- Find a source conversation and, after confirmation, copy and fork it with `handoff`
- Send an initial read-only message to check the transferred context

## Design and Usage Boundaries

Separate `CODEX_HOME` and Electron user data preserve the main app's ChatGPT settings. Provider keys are read from separate files. The Windows script distribution has a different command set; `status` is available in the executable version.

Handoff sends conversation context to the selected provider. External provider charges and quotas are separate from the ChatGPT subscription, with no promise of free usage. The tool depends on internal app launch behavior and the experimental app-server, so Codex updates may affect compatibility.
