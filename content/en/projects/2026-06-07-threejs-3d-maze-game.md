---
title: "3D Maze Game"
subtitle: "A Three.js class project published as a playable 3D maze game"
abstract: "A browser-playable 3D maze exploration game built with Three.js, TypeScript, and Vite. It turns a class project around 3D rendering into a small game with enemy AI, items, a minimap, HUD, and Cloudflare Pages deployment."
role: "3D implementation, game logic, UI implementation, and deployment"
period: "2026"
startDate: "2026-06-07"
endDate: "2026-06-07"
updatedAt: "2026-06-07"
sortOrder: 15
featured: true
tags:
  - Three.js
  - TypeScript
  - Vite
  - Game
  - Cloudflare Pages
demoUrl: "https://3dmazegame.takumi-tokunaga.com/"
links:
  demo:
    label: "Try Demo"
    url: "https://3dmazegame.takumi-tokunaga.com/"
  github:
    label: "GitHub"
    url: "https://github.com/ttokunaga-ja/3D_Maze_Game"
  article:
    label: "Zenn article"
    url: "https://zenn.dev/t_tokunaga/articles/2026-06-07-threejs-3d-maze-game-class-output"
---

## Overview

3D Maze Game is a 3D maze exploration game created as a class project using Three.js. The player moves through a maze, avoids or attacks enemies, collects items, and tries to reach the goal before time runs out.

The public version is available at [https://3dmazegame.takumi-tokunaga.com/](https://3dmazegame.takumi-tokunaga.com/) and can be played directly in the browser.

## Key Features

- Forward and backward movement with `W/S`, and left/right turning with `A/D`
- Attack and wall-breaking actions via Space, left click, or the mobile action button
- HUD for HP, remaining time, and item count
- Minimap showing explored areas, enemies, and items
- Simple enemy AI that starts chasing when line of sight is available
- Items for wall breaking, healing, and extending the remaining time

## Technical Stack

The frontend is built with Three.js, TypeScript, and Vite. Maze walls and floors are rendered as 3D meshes, and repeated wall geometry uses `InstancedMesh` to reduce rendering overhead.

The game runs entirely in the browser and does not require a backend API. It is served as static assets on Cloudflare Pages, with GitHub Actions directly uploading the built `dist/` directory.

## Design Focus

The goal was to turn class work around 3D rendering into something that can actually be operated and shared, instead of stopping at a rendering sample.

Because a 3D view alone can make position and state difficult to understand, the game includes a minimap and HUD. Enemy AI, items, and a time limit make the result feel like a compact game experience.

## Publishing and Operations

The public site is hosted on Cloudflare Pages. A push to the `main` branch triggers GitHub Actions to run type checking, build the site, and deploy it to Pages.

A short write-up about the project is also available on Zenn.
