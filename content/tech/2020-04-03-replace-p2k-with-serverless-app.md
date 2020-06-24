---
title: Replace p2k.co (Pocket to Kindle) SaaS with an event-driven serverless application based on AWS
description: For my reading habits in the recent years I've been using p2k.co service to send Pocket articles to my Kindle. I decided to fix some of p2k shortcomings replacing it with an event-driven serverless application built with AWS Lambda, Fargate and CDK
categories:
  - aws
  - cdk
  - fargate
  - kindle
  - lambda
  - mailjet
---

> A mind needs books as a sword needs a whetstone if it is to keep its edge.
>
> ― George R.R. Martin, _A Game of Thrones_

Growing our professional skillset while keeping an eye on a few different other topics (and exploring fantastic new worlds) is something that many of us find valuable (and pleasant). In time it is then inevitable to develop some kind of *reading habit* that fuels that constant growth combined with a workflow that keeps the habit alive.

This might be even more important during these days while the world is facing the *Covid-19* outbreak. With many of us forcefully at home there might be even more extra time for learning activities... speaking of which, I recommend you to give a look at the many great learning platforms like [Coursera][coursera], [Pluralsight][pluralsight], [Guvi][guvi], [Codecademy][codecademy] and amazing products like [Unity][unity] that are currently allowing free access to many otherwise paid courses.

## Reading Pipeline

Since long the Internet has been offering plenty of (mostly) free content coupled with multiple services designed to optimize our reading habits, such as RSS feed readers, news aggregators, newsletters, and so on.

After mourning for the departure of dear **Google Reader** and **Delicio.us** services, I went in search of other *SaaS* that offered similar functionalities trying to eventually build *the* workflow that best fulfilled my needs.

I became a loyal [Pocket][pocket] user back in the days it was still named *Read It Later* (before the time Mozilla acquired it and rebranded it as *Pocket*). Nowadays to keep my *Pocket* constantly full of new material I make use of [Feedly][feedly] RSS reader iOS app, [Protonmail][prontonmail] iOS/web client for the few newsletters I subscribe to that are not available via RSS and finally both desktop and mobile [Firefox][firefox] web browsers to follow updates from various other sources like *Reddit*, *Mastodon*, *Twitter*, and so on.

To be fair *Pocket*, *Feedly* and *Firefox* **reader view** feature are already providing a good reading experience out of the box, especially in the way they scrape away advertisements and other irrelevant content from the article source... at least when *Pocket* is able to parse it correctly, which in my experience is something around 95% of the times.

I'm also a happy owner of a *Kindle Oasis*, a 7-inch *e-ink* device of pure undisturbed and uncluttered reading bliss; whenever I have the chance I prefer to read everything possibly readable with that, including books, magazines and blog articles. Unfortunately reading PDF documents on a Kindle is a no-go for me so for those documents I still make use of the laptop (or the smartphone in those rare cases I don't have my workstation with me). Side note: if you own a *Kindle* you might also want to check out what [Amazon International Newsstand][amazon-newsstand] has to offer, for example the **AWS Architecture monthly** [free subscription][aws-magazine].

To close the loop between *web source* and *Kindle destination*, i.e. to be able to read those articles I've saved in *Pocket* with my *Kindle*, along the years I've been testing different browsers' plug-ins and SaaS offers such as [Crofflr][crofflr] and probably a few others that I forgot. Finally, as the title of this article already gave away, I landed on [p2k.co][p2k] (*Pocket to Kindle*) and have been relying on it for the last few years.

To recap, this is my current *reading pipeline*:

1. read new articles titles/excerpts from RSS, newsletters, random websites feeds, etc.
1. save the interesting ones into my *Pocket* account for later consumption (e.g. on iOS apps: `share link -> Pocket`, add tags if needed)
1. either read them on mobile *Pocket* app directly or...
1. read the articles digest delivered daily by *p2k* to my Kindle

## Pocket2Kindle

To be honest with you I don't have any real complain with this SaaS product: it's free for my simple use and most importantly it's been doing its job pretty well.

The only few minor downsides that I experienced after long time usage are the following:

- I can get only documents with new articles digests instead of single article documents
- occasionally the delivery freezes until I trigger one manually from the web interface
- it ignores articles that are not recognized as `article` type by *Pocket* (which in some cases appear to be regular web pages that for some reason the *Pocket* scrapers don't like)
- if I want custom delivery frequency I need to upgrade to the *premium* plan
- articles come with clickable hyperlinks which on a Kindle are mostly useless and annoying: from time to time I might end up opening those links in the experimental web browser by mistake when just trying to flip the page or highlight a text section
- sometimes articles have images not properly displayed

Technically speaking *p2k* task is quite simple though: check every day at a configurable time (in my case 6am UTC) if there are unread (`article` type) articles in my *Pocket* account; if so, create a `MOBI` digest document with articles' content and deliver it to my *Kindle*.

At this point if you know me a bit you also know what I might be thinking: that's something that might fit perfectly into a fairly simple ⚡ **event-driven serverless application** ⚡!

## Features request

Basically I want to keep the above mentioned *reading pipeline* intact while adding a few features missing from what *p2k* is giving me today:

### Hard requirements

- single Kindle article documents instead of digests: I prefer to read (and delete soon after reading) each article one by one; having the title in evidence on the document front page helps me when choosing the one to read next based on topic and reading length; it also makes it unlikely to accidentally delete a document before I have read all the content. Finally, the *Table of Content* for each document should show chapters instead of merely listing article titles like in the digest version
- attempt to parse the occasional articles not recognized as `article` type by *Pocket*
- no hypertext links in documents
- have new articles delivered with custom (hourly) frequency
- keep an updated *blacklist* of source *URLs* and *Pocket* article *tags* that I don't want to be sent to *Kindle*
- easy to expand the feature set in the future if needed

### Nice to have

- better images support
- possibility to bypass *Pocket* and send articles URLs to *Kindle* via CLI
- very cheap to keep running, ideally free as it is now

## Implementation

To build the application I relied one more time upon *Amazon Web Services* and built the needed infrastructure with **AWS Cloud Developer Kit (CDK)**.

I decided to extend the already existing [`api-l3x-in`][api] project adding a new stack called (surprise surprise...) `pocket-to-kindle`. You can browse the actual implementation on the GitHub [public repository][api-p2k].

The architecture is slightly more complex [compared][blog-1] to the [previous projects][blog-2] I blogged about. Initially I thought all the software needed for grabbing web article content and producing the `MOBI` file to be delivered was going to run inside some AWS Lambda environments.

Unfortunately my assumption proved wrong early on in the process (more on this later) and basically I had to include a couple of *S3 buckets* and a *Docker* container managed by *AWS Fargate* to take care of one particular task: transform the intermediate `EPUB` artifact into `MOBI` format that's readable by Kindle devices (and applications).

Here the simplified diagram of the final solution:

[![Architecture Diagram]({{ "/img/pocket-to-kindle-diagram.svg" }}){: .img-fluid }](/img/pocket-to-kindle-diagram.svg "Click to view it bigger")

## Plumbing all the things

This is how the *event-driven* workflow looks like:

1. CloudWatch *cron* Event triggers Lambda `reader` (once per hour)
1. Lambda `reader` executes:
    1. loads `since` timestamp from a dedicated CloudWatch Logs group (to comply with *Pocket API* best   practices and fetch only new available article list since the last fetch)
    1. fetches list of available articles from *Pocket APIs* `/get` endpoint
    1. filters out unwanted URLs and tagged articles
    1. for each new valid article (if any) triggers *asynchronously* `create_epub` Lambda in a *fan-out* layout
    1. stores updated `since` timestamp (retrieved from APIs at point `2.1`) in CloudWatch LogGroup
1. for each new article, Lambda `create_epub` executes:
    1. downloads html content from URL found in the triggering event
    1. generates intermediate `Markdown` document using `html2text` 3rd-party library
    1. generates intermediate `EPUB` document from `Markdown` source using `pandoc` binary
    1. drops the new generated document into a dedicated S3 *epub* bucket
1. each new file creation event in *epub* bucket triggers `trigger_ecs_task` Lambda, which sole purpose is to trigger the *ECS Fargate* `kindlegen` *task* injecting proper environment variables (S3 *source* and *destination* buckets, S3 source key name)
1. `kindlegen` Fargate Docker container runs:
    1. downloads *epub* file from S3 source bucket
    1. executes `kindlegen` binary using `EPUB` document as input and producing `MOBI` final document file as output
    1. uploads the final document to S3 *mobi* bucket
1. each new file creation event in *mobi* bucket triggers `send_to_kindle` Lambda which:
    1. invokes `send_to_mailjet` Lambda (exported by the `notifications` CDK stack) passing proper parameters (i.e. S3 `mobi` artifact URI to be delivered, attachment *content-type*, etc)
    1. archives source *Pocket* item via `/send` *API*
1. finally, execution of `notifications.send_to_mailjet` loads attachment content from S3 *mobi* bucket and delivers it to my Amazon *Kindle* email recipient via `/send` *Mailjet API*

To clarify a little why I chose this particular stack and workflow, before starting the implementation I did some research on how to produce high quality *Kindle artifacts* and it turned out that [kindlegen][kindlegen] is currently the best option.

For the sake of completeness I should also mention that I tried a few other options including the ubiquitous [Calibre][calibre] (which frequently pops up in of web searches including *create mobi file*) but I soon realized it's definitely not a good fit in this kind of scenarios: it might represent a very good *point-and-click* desktop solution but it's obviously not meant to be used as a library.

*kindlegen* doesn't support text source files (!) and from my experiments it also does a poor job when using raw HTML as input so, after a bit of more research on what's available in the *OpenSource* domain, I opted for [html2text][html2text] Python library coupled with [pandoc][pandoc] binary, both of which are excellent products: *html2text* does a great job in parsing HTML sources and producing *Markdown* (text) documents while adding very handy features like links removal; on the other hand *pandoc* generates high quality `EPUB` documents that are well supported as input by *kindlegen*.

To sum up, this is the document conversion pipeline:

`(HTML) -> html2text -> (Markdown) -> pandoc -> (epub) -> kindlegen -> (mobi)`

## Aaron Swartz legacy

I diverge for a while because I feel it's important: [html2text][aaron-html2text] was initially developed by the brilliant technologist and hacktivist named [Aaron Swartz][aaron].

Beside his influential political activism, his contributions to the tech world is massive: he actively participated to many popular projects like both *RSS* and *Markdown* specification, *Creative Commons* licenses, *Wikipedia*... I name just a few here because the list is too long.

If you never heard about Aaron and the dystopian legal case that ultimately brought him to commit suicide aged just 26, I strongly recommend you to drop whatever you are doing and go [read about it][aaron-article] and/or [watch the documentary][aaron-doc] freely available on YouTube.

Aaron's story is probably one of the most sobering and emotionally disturbing of modern times, and a stark reminder of what capitalism is all about:

`corporations' profit > *`

Ok, now that I got this out of my chest, let's go back to tech.

## Why Docker

Lambda environments provide access to arbitrary binary execution (proxied by the Lambda runtime, for example in Python case we could use the `subprocess` module for that), provided that they are compatible with the Linux environment where the Lambda functions are actually running.

Unfortunately I wasn't able to make AWS Lambda runtimes properly execute Amazon's *kindlegen* binary. To be honest *kindlegen* shows many signs of *brain damage*, like being distributed for Linux only as a 32-bits binary, not supporting stdin/stdout redirection, and other depressing traits that now I've forgot.

I even tried to execute it via `qemu` [as suggested][aws-forum] by an AWS forum user but it didn't do the trick for me (i.e. it always *segfaulted* soon after execution, no matter how hard I tried).

My options run very thin at that point so I opted to package the binary in a lite *Debian* docker container and have it executed as a AWS Fargate task. This complicated the things a little in terms of infrastructure but ultimately Fargate can be seen as a very similar abstraction to the one provided by Lambda, so not much harm done.

Cherry on top, creating a Fargate setup including the Docker image is a breeze using CDK, the only requirement is having Docker daemon installed and running on the workstation executing `cdk deploy`: this will take care of **all the heavy lifting** of creating a (private) Docker registry in Amazon ECS, downloading the required base images from Docker hub, building the new image to be uploaded, pushing it to the registry, and so on.

I did already mention that **I love CDK**, right? 😀

## Data retention

One of the benefits of using cloud storage services like AWS *S3* and *CloudWatch Logs* is that we don't need to explicitly remove stale data. Instead developers can leverage built-in features like applying *expiration days* that will affect every element in the resource *namespace*, being it an S3 key or a log record.

Accomplishing this with CDK is dumb easy and boils down to just adding a special parameter to the S3 and CloudWatch LogGroup constructs when [defining the objects][api-p2k-cdk], as you can see in the CDK code for CloudWatch LogGroup at line `#40` for example.

In current `pocket-to-kindle` implementation there's no need then for removing the artifacts byproducts created by the pipeline: AWS will take care of deleting them every day exactly after 24 hours of creation. One day retention is more than enough in case I need to do some troubleshooting and see why a particular document has issues; it's also trivial to increase the retention in the unlikely case I see it is not sufficient.

## Sending emails, the easy way

I'd also like to add a special note about the email delivery bit.

Sending emails in a programmatic way is a very common task and developing applications on AWS or elsewhere doesn't change this common need.

AWS offers a fully featured email service solution called **Simple Email Service (SES)** which is powerful indeed. For this task though I chose to test [Mailjet (excellent) service][mailjet] and share here my findings.

SES provides a very low level API which let you build a robust email infrastructure (both for receiving and for delivery) but arguably overkill for simple email delivery needs like mine in this case.

Mailjet fits just perfectly into the `pocket-to-kindle` frame for a few reasons:

- very easy to setup, including *DKIM* settings and such
- generous free plan
- support for bigger attachment size compared to SES
- no need to ask support to *unlock* my account and enable delivery to non verified addresses (like with AWS SES)
- well written and well documented APIs

I'm very happy with the choice made here and I recommend you have a look at their services in case you're looking for some solid *SMTP* SaaS service.

## Pitfalls and Caveats

Here I mention a few of the pitfalls I fell into and the caveats with the current implementation.

As I already mentioned above, I invested some time trying to make *kindlegen* run on Lambda without success. Beside that I also tried a few attempts in having *Calibre* do the parsing of `HTML` into `MOBI` but it proved to be way more difficult that I was expecting so I soon dropped that idea too and focused on having *kindlegen* running in Docker.

I also know *Lambda Step Functions* might be a good approach to this kind of workflow, anyway building this infrastructure with *CDK* is quite straightforward so I didn't go down the *step functions* path given that everything came together pretty easily without any particular need.

Another issue I had to tinker with for a little is that *Pocket API* won't provide a 3-legged (client) OAuth workflow out of the box, instead you need to enable every new application that makes use of the OAuth tokens via a web interface. Thankfully it's not that hard to [automate it][api-p2k-script] almost 100%, I still need to do the final *click* on the browser but it's a one-time action needed to activate the *Pocket* API application so no big deal.

For completion I should also mention that's possible to avoid the need for `trigger_ecs_task` Lambda making use of *AWS CloutTrail* and having hence the S3 *epub* bucket (*PUT*) events trigger Fargate tasks execution. I initially tried that approach too but I could not figure out how to define CloutTrail event transformations (needed to provide proper environment variable to the Docker container) with CDK. Beside that I'm not even totally convinced having a Lambda in this case is such a bad idea: with a Lambda I can still read logs when something is not working as expected for example.

The solution I came up with is fulfilling all my hard requirements but it's definitely not perfect. For example there's no retrial mechanism in place in case there are temporary problems with any HTTP request (either to *Pocket APIs* or source websites), nor I get notified if something goes wrong in the pipeline, but not being a *mission-critical* application is a decent enough trade-off and ultimately there's zero data loss given that every article is always available in my *Pocket* account.

The only race condition I could think might pop up is mistakenly archiving an article in *Pocket* even if the article is not properly delivered to the Kindle (I'm assuming a Mailjet accepted send request equals a proper delivery).

## How much does it cost

I've not been running it for a full month yet so without a proper bill statement from AWS is hard to say for sure. I've briefly tried to figure it out with the cost estimator though and, unless I'm forgetting something in my calculations, its impact on my (already cheap) AWS monthly bill should be irrelevant (a few Euro cents at most).

An important note though: by default, when using Fargate, `cdk deploy` will create a VPC private subnet complete with *NAT-gateway* which is definitely non-free and can add up quite some costs at the end of the month. To avoid that I just configured Fargate to run tasks inside a *public subnet* instead.

To clarify a bit about the security implications of this choice, the risks compared to the default case of having a private subnet are minimal: external access to what's in the subnet is properly locked down by *Ec2 Security Groups* and, even in the unlikely event of a breach, Fargate resources have only the required minimum access to interact with the two above mentioned S3 buckets plus  the ability to pull images from the ECS registry, nothing else.

Public and private VPC subnets come handy in multi tiered applications scenarios, like when there are both frontend and backend services; in the case presented in this article technically speaking the difference between a public and private subnet is basically irrelevant.

## Wrapping up

All in all I'm very satisfied with the outcome, all the hard requirements are fulfilled and the documents delivered by **pocket-to-kindle** are very high quality, images included (not all the times but it's not a major problem for me anyway).

I have to confess I partially cheated writing the title: *p2k.co* for now is still in place so to have 100% articles coverage the next morning for those source articles not supported (yet) by my solution. In time though I'll eventually fix the remaining issues and probably get rid of *p2k* for good.

On the implementation side, one more time I'm pleased to say it was great fun to work with AWS, CDK and 3rd-party public APIs.

The unexpected complications given by *kindlegen* binary stubbornness gave me the chance to better test how CDK behaves in scenarios where other AWS services like Fargate are involved.

As is often the case, an *event driven* solution is quite flexible and leaves room to further extensions and experimentations, like letting me tap everywhere into the workflow to extend or bypass some of the steps; for example now I can just upload any `EPUB` document saved in my workstation into the proper S3 bucket to have it delivered to my Kindle a few minutes later. Neat, right?

As usual I close my article thanking you for following me so far and reminding that you that I'm very happy to hear what you also think about this. Please just drop a comment here or get in touch with me directly via the [contact] page.

[aaron-article]: <https://www.bostonmagazine.com/news/2014/01/02/bob-swartz-losing-aaron/>
[aaron-doc]: <https://www.youtube.com/watch?v=vXr-2hwTk58>
[aaron-html2text]: <http://www.aaronsw.com/2002/html2text/>
[aaron]: <https://en.wikipedia.org/wiki/Aaron_Swartz>
[amazon-newsstand]: https://www.amazon.com/Magazines-Journals-Kindle/b/?ie=UTF8&node=241646011&ref_=sv_kstore_7
[api-p2k-script]: <https://github.com/shaftoe/api-l3x-in/blob/0.7.0/lib/stacks/pocket_to_kindle/authorize_app.py>
[api]: <https://github.com/shaftoe/api-l3x-in/>
[api-p2k]: <https://github.com/shaftoe/api-l3x-in/tree/0.7.0/lib/stacks/pocket_to_kindle>
[api-p2k-cdk]: <https://github.com/shaftoe/api-l3x-in/blob/0.7.0/lib/stacks/pocket_to_kindle/__init__.py>
[aws-forum]: <https://forums.aws.amazon.com/thread.jspa?messageID=934688>
[aws-magazine]: <https://www.amazon.com/AWS-Architecture-Monthly-FREE-Subscription/dp/B077F2P7DH>
[blog-1]: <https://a.l3x.in/2020/02/04/migrating-from-terraform-to-cdk.html>
[blog-2]: <https://a.l3x.in/2020/02/17/serverless-publish-to-multiple-social-media.html>
[calibre]: <https://calibre-ebook.com/>
[codecademy]: <https://www.aabhusanaryal.com.np/2020/03/free-codecademy-pro.html>
[contact]: <https://a.l3x.in/contact>
[coursera]: <https://blog.coursera.org/coursera-together-free-online-learning-during-covid-19/>
[crofflr]: <https://www.crofflr.com/>
[feedly]: <https://feedly.com/>
[firefox]: <https://www.mozilla.org/en-US/firefox/new/>
[guvi]: <https://www.guvi.io/courses>
[html2text]: <https://github.com/Alir3z4/html2text/>
[kindlegen]: <https://www.amazon.com/gp/feature.html?docId=1000765211>
[mailjet]: <https://www.mailjet.com/>
[p2k]: <https://p2k.co>
[pandoc]: <https://pandoc.org/>
[pluralsight]: <https://www.pluralsight.com/>
[pocket]: <https://getpocket.com>
[prontonmail]: <https://protonmail.com/>
[unity]: <https://unity.com/learn>
