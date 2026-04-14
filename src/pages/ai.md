---
layout: ../layouts/ProseLayout.astro
title: AI
description: How I use AI and coding agents in my projects — including this very website.
url: https://a.l3x.in/ai
keywords: ["ai", "coding agent", "pi", "automation", "llm"]
subtitle: "AI-assisted development in practice."
---

## Pi Coding Agent

I maintain [Pi](https://github.com/shaftoe/pi-coding-agent-action), an open-source GitHub Action that turns an LLM into a first-class collaborator on any repository. Pi reads issue descriptions, reviews pull requests, and pushes commits — all triggered by a simple comment on a GitHub issue or PR.

## How Pi works on this website

This very codebase uses Pi through the [`pi.yml`](https://github.com/shaftoe/personal-website/blob/master/.github/workflows/pi.yml) GitHub Actions workflow. When a comment is left on an issue or pull request review, Pi kicks in, analyzes the context, and produces code changes as a new commit or pull request.

The workflow configuration is minimal:

```yaml
jobs:
  pi-agent:
    uses: shaftoe/pi-coding-agent-action/.github/workflows/pi.yml@v2
    with:
      allowed_actor: shaftoe
```

Only the repository owner can trigger the agent, keeping full control over what gets merged.

## Philosophy

I see AI coding agents as a force multiplier — not a replacement. Pi handles the mechanical parts of software development (scaffolding, refactoring, boilerplate) so I can focus on architecture, design decisions, and domain logic. Every change it produces is reviewed before it lands on `master`.
