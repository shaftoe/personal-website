---
title: For simple tasks plain vanilla is still my favorite flavour of JavaScript
description: I developed a simple JS audio player for a recording studio website and put it on GitHub. In this article I share my thoughts and findings.
tags:
  - audio
  - howler
  - javascript
  - vanillajs
---

In the last months I've been developing the habit of pushing to GitHub anything tech-related that I've been working on and might be remotely interesting to anyone else (today or in the far future, thanks to search engines). It also have the side benefit of forcing me to keep the project a bit more tidy than I might do otherwise, adding at least a decent README and maybe a [CHANGELOG][keep-a-changelog] too if I already plan to develop it any further.

Recently for example I've been tasked with a simple but interesting project that requires some JavaScript foo: a [recording studio][studiocompresso] that needs to promote its new offering on its website and, to showcase some features, let the website user play some audio content.

So far nothing special you might say, and you're damn right: the HTML5 `<audio>` tag is well supported and that's basically all you need. Job done, ticket closed. Well, not so fast 😆

## Grab a brush and put a little make-up

Between the various provided services the main one is *online* mixing music tracks: their clients can tap into the high-quality mixer's output in real time and actually follow live all the stages of the mixing process. Quite cool, right?

For the ones like me who’re not too familiar with the HI-FI world, this is what mixing on a *[Neve][neve] VR console* means according to [the promotional page][studiocompresso-mixpage]:

> [...] dressing your music with the best outfit ever, polishing its shoes, making it wear the best brand watch

## A scoop of vanilla is all I need

Here come some specs:

- the web player needs to let the client play two different versions of the same sample, the *unmixed* and the *mixed* one
- both versions of tracks playback need to be *in sync* so the listener can toggle back and forth between the two sometime in the middle of the playback and doing so experience the actual difference that a mixing process makes to the final product
- the player should support multiple track groups and take care of pausing the other groups playback when a new playback is started.

As usually it is the case, this is something much easier to show than to describe with words, so have a look at [the demo page][demo] and at [the code][repo] to see (and hear) what I mean. The logic is implemented with some very simple plain vanilla JavaScript that depends only on the nice [Howler JS library][howler] to work.

No Svelte nor Vue nor any other fancy new reactive framework (even though I admit the temptation to approach the problem with one of those was hard to resist 😅), not even good ol' jQuery. I just put Babel in the bunch to extend the support for most of the browsers still in use today, nothing else.

[The script][code] is meant to be a pluggable solution that won't require editing the JS code in the future when the HTML changes: making use of some *configuration by convention* it scans the DOM at load time for certain HTML *button* tag IDs and add proper listeners to the *onclick* event, hence supporting multiple track pairs.

## I know, it's only JavaScript but I like it

Coming from the backend [side of things][blog-1] I confess that in the past I used to secretly mock JavaScript for its famous shortcomings (like `typeof(NaN) === "number"`... [WAT?!?][wat]) and not being up to par with other more *modern* languages, but the more I learn JS and its ecosystem the more I actually like it.

Well, *only fools and dead men don't change their minds*, says the wise man.

Truth is, since then there's been a massive development effort in modernizing JS and sugary things like *Promises* and `async/await`, together with the solidity of projects like *V8* and *Node.JS* (and soon [*Deno*][deno]? we'll see) and the many others like *TypeScript* for example helped to massively improve the developer experience and, maybe more importantly, let JS break out the browser confinement and explore other dev territories like backend and desktop applications.

Anyway, like it or not, it's still [the most popular][most-popular] programming language on the planet so even hardcore purists coders might get their shirt dirty with some *vanilla* sooner or later 🍨

As usual I'm eager to know your thoughts, improvements, suggestions, etc. Drop a comment here or [contact me directly][contact] if you prefer.

[blog-1]: <https://a.l3x.in/2020/01/29/my-quest-for-identity-in-software-engineering.html>
[code]: <https://github.com/shaftoe/js-mixed-audio-player/blob/0.1.0/src/player.js>
[contact]: <https://a.l3x.in/contact>
[demo]: <https://shaftoe.github.io/js-mixed-audio-player/>
[deno]: <https://breadth.substack.com/p/what-the-hell-is-a-deno>
[howler]: <https://howlerjs.com/>
[keep-a-changelog]: <https://keepachangelog.com/en/1.0.0/>
[most-popular]: <https://insights.stackoverflow.com/survey/2020#most-popular-technologies>
[neve]: <https://en.wikipedia.org/wiki/Neve_Electronics>
[repo]: <https://github.com/shaftoe/js-mixed-audio-player>
[studiocompresso-mixpage]: <https://www.studiocompresso.com/en/online-mixing/>
[studiocompresso]: <https://www.studiocompresso.com/en/>
[wat]: <https://www.destroyallsoftware.com/talks/wat>
