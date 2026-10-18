---
title: "HandSlapRace"
subtitle: "Multiplayer VR horse racing through alternating hand movements"
abstract: "A collaborative VR project in which players race as horse avatars using alternating hand movements on artificial-turf-covered input devices. I handled server implementation and project management for Unity development, including implementation, progress tracking, and quality assurance. I also worked on real-time communication quality."
role: "Server implementation / Unity project management and implementation / Progress tracking / Quality assurance / Communication quality improvement"
period: "HIS 2026 demonstration / Co-author"
publishedAt: "2026-09-16"
sortOrder: 5
featured: true
tags:
  - VR
  - Unity
  - WebSocket
  - UDP
  - Research
links:
  paper:
    label: "Paper PDF"
    url: "https://www.rm2c.ise.ritsumei.ac.jp/papers/2026/HIS2026_HandSlapRace_final.pdf"
  publication:
    label: "Laboratory publication record"
    url: "https://www.rm2c.ise.ritsumei.ac.jp/demonstrations.html"
---

## Overview

This collaborative VR locomotion system maps alternating hand movements to a horse avatar's running speed. It combines contact with artificial turf and airflow that changes with speed. The application supports multiple participants and NPCs racing together.

## My contributions

I handled server implementation and served as the project manager for Unity development, including implementation, progress tracking, and quality assurance. I also worked on improving communication quality in the multiplayer real-time game.

## System architecture

The system uses WebSocket for race events such as the start and finish, and UDP for frequently updated state such as position and speed. Five HMDs were connected to the same race-management server during a preliminary exhibition.

## Exhibition and publication

The exhibition on May 17, 2026 received 39 post-experience questionnaire responses about the overall research system. These are preliminary exhibition findings; comparison with conventional controller input remains future work. They do not measure the effect of communication improvements.

The research was presented as a demonstration at HIS 2026, and I am a co-author of the paper.

S. Kishino, T. Saito, T. Tokunaga, et al. “A Hand-Based VR Locomotion System for Running as a Horse Avatar.” Human Interface Symposium 2026, demonstration 1T-D16W, September 16, 2026.

[Paper PDF](https://www.rm2c.ise.ritsumei.ac.jp/papers/2026/HIS2026_HandSlapRace_final.pdf) / [Laboratory publication record](https://www.rm2c.ise.ritsumei.ac.jp/demonstrations.html)
