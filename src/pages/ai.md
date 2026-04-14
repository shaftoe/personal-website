---
layout: ../layouts/ProseLayout.astro
title: AI
description: How I use AI and coding agents in my projects — including this very website.
url: https://a.l3x.in/ai
keywords: ["ai", "coding agent", "pi", "automation", "llm"]
subtitle: "AI-assisted development in practice."
---

## Philosophy

I've been toying around with a few harnesses (Claude Code, Codex, OpenCode) and settled for <https://pi.dev> which follows a minimalistic approach that makes it very performant and easy to hack. It's fun, try it out and join me in the official Discord channel, I'm Al3xFor there ✌️

## Pi Coding Agent

I maintain various [Pi extensions](https://www.npmjs.com/~alexanderfortin?activeTab=packages) and [Pi coding agent action](https://github.com/shaftoe/pi-coding-agent-action), an open-source GitHub Action that turns any LLM model supported by Pi into a first-class collaborator on any GitHub repository. Pi agent reads issue descriptions, reviews pull requests, and pushes commits — all triggered by a simple comment on a GitHub issue or PR.

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
