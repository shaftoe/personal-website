---
title: Serverless vanity Go import server
description: I cooked my bespoke solution to avoid coupling my Go code with GitHub
slug: vanity-go-import
timestamp: 2026-09-28
tags:
  - golang
  - netlify
  - pnpm
  - serverless
  - typescript
---
Today [this article](https://iain.rocks/blog/dont-couple-your-go-code-to-github) titled "Don't couple your Go code to GitHub" is [trending](https://news.ycombinator.com/item?id=49868404) on Hacker News. It is definitely good advise and, in the era of LLM coding agent, it's practically free and _almost_ instantaneous to build.

The author shows how to implement such a solution with Nginx, which of course works and it's not that hard to setup BUT I'd need to run it somewhere (e.g. on my VPS). In my opinion this is just a perfect use case for a _serverless function_ so I came up with this simple piece of Typescript instead: <https://github.com/shaftoe/go-vanity>

Currently it's kindly built, deployed and hosted by [Netlify](https://github.com/shaftoe/go-vanity), which is an awesome service provider that offers a very generous free tier and smooth integration with GitHub.[^1]

TL;DR: I now have my serverless _vanity_ Go import server hosted at <https://code.l3x.in/> which lets me release Go modules as `code.l3x.in/module_name` while hosting them on GitHub, it should also be very easy to use for anyone who has a GitHub and a Netlify account (both free).

[^1]: I don't have any affiliation with Netlify, I just like their products and use them for many of my personal projects since long, e.g. this very blog/website is hosted there
