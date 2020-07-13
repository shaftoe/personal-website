---
title: "Remaking my curriculum vitæ with modern web technologies"
description: "For a while I wanted to manage my CV in a more flexible way. I stumbled upon a great article on CSS-Tricks that made me think I had no more excuses to procrastinate. In this article I present my solution along with some considerations."
tags:
  - css3
  - html5
  - hugo
  - jamstack
  - serverless
  - web
date: "2020-01-31"
---

As I wrote in my [previous blog article][previous-blog], recently I became quite hooked by the web and all that's orbiting around it.

This time I'm going to show you a simple project developed following Jamstack guidelines:

- HTML5 for responsive and accessible markup
- CSS3 to lay out the presentation
- Hugo to statically generate the content
- GitHub for source hosting
- Netlify for content hosting and (fast) delivery

## The project

In the past I've been relying on a free offer from [VisualCV][visual-cv] to host my curriculum vitæ online. Recently though (end of 2019) they changed their terms and removed the free offer, so no more CV online for free.

For a while I wanted to manage my CV in a more flexible way than VisualCV or any other job platform like LinkedIn offer. Almost at the same time of VisualCV move I stumbled upon this [great article on CSS-Tricks][css-article] by Ali Churcher, I liked it quite and made me think I had no more excuses to procrastinate.

I thought a while about how to best approach the issue and then put in practice my new acquired skills as a web developer (while having quite some fun in the process).

## Feature request

CSS-Tricks' article is showing flawlessly how to setup the layout, and that's exactly what I'd expect from an article by CSS-Tricks, but to me it is missing a few key features to make it really shine.

One feature I definitely want to have is a comfortable way of managing the CV content. In the end what's the point of having it online if I can't keep it up to date with ease?

In practice I just want to open my IDE, edit some Markdown, run `git commit && git push` and have the new changes deployed online asap.

## Implementation

To add my features I pair the cited HTML5+CSS3 _tricks_ with Hugo and its powerful content management features.

A couple of more clicks in the Netlify app (plus a few new DNS records in my `l3x.in` domain) and everything is live at <https://cv.l3x.in>, replacing the old HTTP redirect to VisualCV.

You can find the actual source in [the GitHub repository][repo] with all the details in [`README.md`][readme], together with a mini tutorial on how to use it to build your own CV.

## Highlights

I take the chance to highlight a couple of more things:

- differently from the layout proposed by CSS-Tricks, I opted for keeping the header (name, title and photo) outside the main grid. To me it makes more sense to have it decoupled from the content (i.e. from the grid) because the likelihood I'll put it anywhere else than the top is close to zero, and having picture and text box swap relative position with `display: flex` is trivial
- in [layouts/partials/head.html](https://github.com/shaftoe/curriculum-vitae/blob/master/layouts/partials/head.html) there are a few tricks to make the site load faster, thanks to Google Insights. At the time writing the live site [scores above 99%][insights] for both mobile and desktop
- Hugo makes it fun to add all sort of functionalities, [for example][footer] the _copyright_ and _last modified_ info in the footer
- another cool thing when using Hugo, you might think of partials as sort of [web components][web-component], that might help [structuring your markup][base-of] in a way clean and easy to maintain

## Possible enhancements

I'm quite happy with the results and I don't think I'll change the layout for a while (I always need to improve the content but that's out of scope eheh).

If you have any suggestions or recommendations please let me know either by leaving a comment below, [contacting me directly][contact] or (even better) opening a [pull request][pull].

I list here a few of the possible improvements that came to my mind so far:

- I've used SCSS (in [assets/][assets] folder) to keep the style DRY but I'm pretty sure there is a lot of room for improvement
- The _scroll to top_ icon should appear only after some scrolling, I don't know if that's possible in pure CSS alone and I'd like to keep the project JS free. If you know how to do it in CSS please let me know, thanks!
- The footer could appear at the very end of the viewport even when content is not filling up the page completely (e.g. <https://cv.l3x.in/programming/>). It should be easily done with flexbox, I'm ok as it is for now

## Feedback always welcome

I hope you like it and hopefully find it useful too.

As usual I'm more than happy to hear what you think, _especially_ if you have something critic to say about it: for sure it will hurt a bit but so far I don't know any better way to improve my skills ;)

[repo]:          <https://github.com/shaftoe/curriculum-vitae/>
[readme]:        <https://github.com/shaftoe/curriculum-vitae/blob/master/README.md>
[css-article]:   <https://css-tricks.com/new-year-new-job-lets-make-a-grid-powered-resume/>
[previous-blog]: <https://a.l3x.in/2020/01/29/my-quest-for-identity-in-software-engineering.html>
[visual-cv]:     <https://www.visualcv.com>
[footer]:        <https://github.com/shaftoe/curriculum-vitae/blob/master/layouts/partials/footer.html>
[base-of]:       <https://github.com/shaftoe/curriculum-vitae/blob/master/layouts/_default/baseof.html>
[web-component]: <https://developer.mozilla.org/en-US/docs/Web/Web_Components>
[insights]:      <https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fcv.l3x.in%2F&tab=desktop>
[assets]:        <https://github.com/shaftoe/curriculum-vitae/tree/master/assets>
[contact]:       <https://a.l3x.in/contact.html>
[pull]:          <https://github.com/shaftoe/curriculum-vitae/pulls>
[jamstack]:      <https://jamstack.org/best-practices/>
