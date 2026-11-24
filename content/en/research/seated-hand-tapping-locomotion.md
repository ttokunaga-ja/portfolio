---
title: "A Seated Hand-Tapping Locomotion Technique for Running Horse Avatar Embodiment"
subtitle: "ACM VRST 2026"
abstract: "This collaborative research proposes a seated VR locomotion technique in which alternating hand taps let users run as a horse avatar. The work was presented in the ACM VRST 2026 demo session and published in the proceedings."
role: "Server implementation / Unity project management and implementation / Progress tracking / Quality assurance / Communication quality improvement"
period: "ACM VRST 2026"
publishedAt: "2026-11-16"
featured: true
tags:
  - VR
  - Locomotion
  - Unity
  - WebSocket
  - UDP
links:
  paper:
    label: "Read the paper in the ACM Digital Library"
    url: "https://dl.acm.org/doi/10.1145/3822517.3849971"
---

## Research overview

The technique maps alternating hand taps to the running motion of a horse avatar in VR. It is designed to let users control the avatar and experience running as a horse while seated.

In the collaborative project, we integrated this technique into HandSlapRace, a multiplayer VR horse-racing system. It combines contact with artificial-turf-covered input devices and airflow that varies with running speed. Multiple participants and computer-controlled racers can compete in the same race.

## My contributions

I handled server implementation and served as the project manager for Unity development, including implementation, progress tracking, and quality assurance. I also worked on improving communication quality in the multiplayer real-time game.

## System architecture

The system uses WebSocket for race events such as the start and finish, and UDP for frequently updated state such as position and speed. Five HMDs were connected to the same race-management server during a preliminary exhibition.

## Preliminary exhibition feedback

The exhibition on May 17, 2026 received 39 post-experience questionnaire responses about the overall research system. These are preliminary exhibition findings; comparison with conventional controller input remains future work. They do not measure the effect of communication improvements.

## Presentation and publication

The work was presented in the ACM VRST 2026 demo session in Sendai on November 18, 2026. I co-authored the proceedings paper.

Tomoki Saito, Shoyo Kishino, Takumi Tokunaga, Ryota Isoe, Yoshito Maeda, Fumihiko Nakamura, Fumihisa Shibata, and Asako Kimura. 2026. A Seated Hand-Tapping Locomotion Technique for Running Horse Avatar Embodiment. In _Proceedings of the 32nd ACM Symposium on Virtual Reality Software and Technology_, pp. 1–3. DOI: 10.1145/3822517.3849971.
