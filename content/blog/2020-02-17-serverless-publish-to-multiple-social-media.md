---
title: Automate social media status updates with AWS Lambda, SNS and CDK
description: In the previous article I introduced AWS Cloud Developer Kit and wondered if and how to make use of code abstractions when designing IaC. Today I show you one way to extend the previous codebase and deploy a typical event driven (pub-sub) serverless application built with Lambda and SNS.
tags:
  - api
  - lambda
  - python
  - serverless
date: "2020-02-17"
---

As some of you have noticed, recently I've been blessed with some extra time and decided to take [the chance][blog-1] to finally [come up][blog-2] with some fresh [new content][blog-3] for this blog.

How to choose a new pet project in the IT world where the choice of things to be learnt and practiced to stay relevant is simply overwhelming?

With a _green field_ pet project I generally move from fresh itches that I'd like to scratch because, well... there's never a shortage of them, no matter how serious you are in trying to automate them all away.

I try then to come up with a feasible solution that won't need any wheel to be reinvented, spend too much money to keep it up and running or require too much time and effort to actually make sense.

Once the goal and its scope are defined I select the tech stack but, instead of being strict in choosing the right tool for the job (as I'd do while working under contract), I let my curiosity for the new interesting tech lead at least some of my choices.

To be clear, I don't want to jump on the _first buzz_ at hand, I still try to pick the best tools for the job but not being yet confident with those tools I can only make educated guesses.

Beside the curiosity for leveraging abstractions writing CDK code as mentioned in the [previous article][blog-abstract], it's been a while that I wanted to better understand the [OAuth][oauth] flows that today are very common for authenticate/authorize public APIs.

## Let's scratch

Especially now that I'm publishing content more frequently (and planning to keep doing so) I want to inform the ones who follow me when there's a new article available, otherwise what's the point of producing any content?

In time though the social media accounts and (re)publishing platforms proliferated almost out of control. [The good old days][good-old-days] when basically everybody in the Internet owned a personal website ([GeoCities][geocities] anyone?) are long gone and apparently for good.

To be more specific, here is a list of my current digital presence so far:

- [this blog][blog]
- [Mastodon][mastodon]
- [Twitter][twitter]
- [Dev][dev-to]
- [LinkedIn][LinkedIn]
- [Hacker news][Hacker news]
- [Reddit][reddit]
- [Medium][medium]
- ...

... and no need to mention how the Instant Messaging situation is even worse, right?

I suspect I'm forgetting one or two but you get the point: they are already too many to even remember without browser bookmarks hints and it's safe to say the list in time is likely going to grow.

This means that every time I publish a new article, unless I'm relying only on the [RSS feed][rss] to spread the news, for each of the above accounts I should:

- open a new tab in the browser
- perform a _log in_ (with two-factor authentication of course...)
- pass the occasional [Voight-Kampff] _recaptcha_ test
- finally, _copy&paste_ in a _textarea_ some text that might look like this:

```bash
New blog post:
[a brief description of the content...]
https://link.to.new.article
```

a snippet that will need slightly different content and formatting depending on the targeted platform (e.g. in Twitter prefer _title_ over _description_ to fit into the 140 characters limit, etc)

I know there are multiple professional services like [Hootsuite][hootsuite] that provide this kind of feature (and many more) but, unless you're willing to pay for the premium service, usually they put strict limitations on how many integrations you can use, how many posts per month, and so on.

Actually I'm even ok paying a monthly fee for something I deem valuable but for such a simple use case a fully featured _SaaS_ is definitely overkill. On top of that I'm even happier if I can avoid sharing any sensitive data like secret tokens with any 3rd party service.

As you already have guessed from the spoilering title, this looks like a _perfect use case_ for a serverless event-driven application on AWS.

## The tech stack

For the case I'm presenting here, the choice fell on the following technology stack:

- AWS Lambda + SNS to build the infrastructure
- AWS CDK to model the infra plus create/update and wire together its building blocks
- Python 3.8 + _Boto3_, [_requests_oauthlib_][requests-oauth] and [_BeautifulSoup4_][BeautifulSoup4] 3rd party libraries as runtime for the application

## What's the story

The hypothetical _user story_ for this project might have looked something like this:

> As a blog writer, I want to automatically update all my social feeds with a link to the new article as soon as it's published.

and here the features request:

### hard requirements

- fully managed infrastructure, near-zero maintenance needed
- cheap to the point of being free (until I learn how to publish new posts at sub-second frequency. Just kidding 😁)
- simple to manage
- easy to add new output services for different social medias

### soft requirements

- have the whole process 100% automated
- delivery to all the social networks mentioned above
- highly available
- fun to build

## Show me the code

This time instead of creating a dedicated repository with some example code I decided to clean up the actual codebase I was already using to deploy my personal APIs and make [the repository public][repo].

So, speaking of abstractions, I added to the main CDK app ([`lib/cdk.py`][src-cdk]) two more stacks that join the previous single one, [`api`][src-stack-api].

The first new stack is called [`lambda-layers`][src-layers] and its only reason to exist is to keep the Lambda Layers isolated from the other stacks unless those stacks need one or more Layer as dependency: in that case `stacks.lambda-layers.layers` object will be passed to the needing stack as parameter, making that part of the code DRY and pluggable as needed (more on this later).

If you don't know already Lambda Layers, it's a powerful AWS Lambda feature that lets you provide additional code to your Lambda runtime, removing for example the need for bundling external libraries together with your actual Lambda code. You can read more about how Lambda Layers work [here][layers-blog].

Speaking of CDK, I've restructured a bit the codebase compared to the one you find in the [mini-tutorial][example repo] from the [previous article][blog-3]. Instead of the default scaffolding provided by `cdk init` I preferred a files and folders structure that I find easier to understand and reason about. There are now no redundant folders and everything that relates directly to CDK is either in a `cdk.py` file or in `stacks/<stack_name>/__init__.py`.

Another improvement to the DRYness is that now default values and helpers for CDK live in the [`utils.cdk` library][src-utils-cdk] that's shared by all the stacks.

The actual code for each individual application (`api`, `publish-to-social`, `lambda-layers`) can be found under `stacks/<stack_name>` [folder][src-stacks], packaged according to the specific application needs.

The `api-l3x-in` project is basically a container for different applications, the new one I'm going to focus on now is `publish-to-social`.

## publish-to-social

Here a diagram that shows how the building blocks of `publish-to-social` are connected:

[![Architecture Diagram]({{ "/img/publish-to-social.svg" }}){: .img-fluid }](https://a.l3x.in/img/publish-to-social.svg "Click to view it bigger")

It's a simple and fairly typical _pub-sub_ (and stateless) _serverless_ application with one main Lambda _publisher_ that sends messages to an SNS topic and multiple Lambda _subscribers_ that are executed every time there's a new message in the topic.

One of the main benefits of decoupling services communication via a messaging bus like SNS is that publishers can be oblivious of subscribers existence, hence we can add as many Lambda subscribers as we need without making any change to the publisher(s) code (another main benefit is _increased scalability_ which is obviously not a requirement in this case, I just mention for the sake of completeness).

I started with the idea of having a small prototype to share but somehow I quickly came up with what I think is a decent solution and something that I might want to maintain for a while, so I'll soon freeze the API at v1.0.0 after adding some unit tests (I know, I know...) and maybe a couple of more features and/or support for other social services.

Speaking of services, a few adapters for the social networks mentioned above are already implemented, you can find them all in the [`publish-to-social.lambda.services`][src-services] module with links to APIs documentation. All the heavy lifting for logging, handling exceptions, parsing events and implementing proper response interface are shared by all the lambdas so the code needed for each service is very small, you can have a look at [`utils.handlers`][src-handlers] and [`utils.helpers`][src-helpers] modules for more details.

Probably so far the most interesting implemented one is [`devto`][src-devto]. It's slightly more complex compared to the others given that instead of a simple text message it publishes the whole article (with the original link set as _canonical url_); this is how the flow looks like:

1. [`publish-to-social` main lambda][src-publish-main] is triggered via CLI, then:
    1. scrapes the URL given as input in search for content
    1. if point `1.1` is successful, publishes a message to the SNS topic
1. [`devto` lambda][src-devto] is triggered (simultaneously with all the other services) by the SNS subscription, then:
    1. authenticates to [GitHub APIs][github-api] and fetch some Markdown content from my private _blog_ repository
    1. finally, publishes the article using _dev.to/articles/_ endpoint

### User Interface

The soft requirement of _100% automation_ is not met yet, ideally the process should be initiated by some kind of _cronjob_ action using the [blog RSS feed][rss] as source for new articles data. It should be fairly easy to implement but I felt there's already enough beef to share right now.

Currently to publish a new article link on (some of) my feeds I just need to trigger a Lambda execution from the terminal (I'm actually using a wrapper script to just provide the url as argument, here I show the internals):

```bash
$ aws --profile api-l3x-in \
    lambda invoke \
    --function-name publish-to-social-publishtosocial17FB96F7-LXWRTUFARTKU \
    --invocation-type RequestResponse  \
    --payload '{ "url": "https://a.l3x.in/link/to/the/article.html" }'

# Response that implements Api Gateway interface
{"isBase64Encoded": false,
"headers": {"Access-Control-Allow-Origin": "*"},
"body": {
    "message": "messageId '5ad1368b-fda5-5c89-8b9e-604bad6433f9' with content scraped from source https://a.l3x.in/link/to/the/article.html delivered successfully"
},
"statusCode": 200}
```

For now I'm ok with the UX bit and I don't have to deal with any (inconsistent) state nor double posting issues but it's definitely something I might add eventually and might end up in a dedicated article.

As a side note, Python [Feedparser][feedparser] external library is powerful and easy to use, I [had the pleasure][blog-0] to work with it [back in the days][ha-feedreader] when I was actively contributing to the awesome [Home Assistant][home-assistant] Open Source project. Now I just have to figure out how to handle the last submission state, for example keeping a record updated in a _DynamoDB_ table. For the _cronjob_ part, I already know where to get inspiration thanks to [this great article][cdk-twitter] by Blake Green.

## 404 Social not found

Unfortunately I discovered exploring the various APIs' documentation that some of the most popular social networks don't allow this kind of workflow. For example:

- LinkedIn support answered me they don't let developers use _OAuth 2-legged authorization_ anymore:

  > "All of our API calls run through 3-legged authorization. We are not assigning [2-legged auth][2-legged-auth] for any of our partners"

- Hacker News is [read-only][hackernews-ro]
- Facebook posting via the `/feed` endpoint is [disabled since April 24, 2018][fb-disabled]

As a side note, I honestly find this lack of faith in their users... [_disturbing_][lack-of-faith]. In a world _eaten by software_ like the one we live in today I'd consider this a basic feature and its unavailability a strong factor for deciding which platform is less worth investing in (professionally speaking).

## Pitfalls

I list here some of the missteps I made along the way in the hope they might help someone avoid time waste (and frustration):

- making changes to `lambda-layers` stack after the initial deploy leads to CDK inconsistent states because of an open [CloudFormation bug][bug-cf-layers]. As a workaround you could think of bundling external libraries' code in the stack or use the Layer resource name (instead of the `stacks.lambda-layers.layers` _object_) as input for other stacks. This obviously **clashes with the premise of CDK abstractions** in the first place. I'm ok with what I have right now but I might change my mind in the future if I see my need for Layers increases. If you end up in an inconsistent state for whatever reason, you might need to either destroy/recreate all the stacks one by one in reverse hierarchical order (`lambda-layers` at last) or, in case you can't sustain any downtime, deploy to a different target region and/or account, migrate the service and finally destroy the original setup
- as already mentioned above, many platforms don't give write access via APIs and you might end up spending quite some time implementing what you found in the documentation... before discovering that they won't work as expected because of missing support for _Oauth 2-legged flow_ for example.
- in the official [example repositories][cdk-examples] you might find outdated CDK code, nothing major popped up so far but at least some deprecated code here and there (for example the use of `core.Code.Asset` instead of `core.Code.fromAsset`), so better to double check the docs all the time after the occasional [_cargo cult_][cargo-cult] rushes
- just increase memory when lambdas are dying early without producing logs even if logs `REPORT` from _CloudWatch Logs_ say max memory limit was not reached (in my experiments I never went over 80Mb but a few Lambdas were dying silently when running with the 128Mb default ram size, just doubling the allotted memory solved the problem)
- deleting CloudWatch _LogGroups_ manually lose their default retention period when automatically recreated by Lambda's execution
- prefer `requests` over the more complex standard `urlilib` Python library if you don't mind adding an external dependency, it will make your life _much_ easier

## Caveats

Lambdas defined in the same stack are always redeployed when there's any change in the stack folder (excluding the CDK code) or in the `utils` library. This is by design:

- given the tiny blob size (64Kb unzipped, less than 8Kb after compression) the code is the same for all the lambdas anyway and in this way I ensure they're always running the latest version
- the blob _zip_ archive is uploaded only once per deploy so only a new `UpdateFunctionCode` call per Lambda with a link to the new uploaded code archive in S3 is triggered, i.e. there's no bandwidth waste anyway

If that doesn't fit your needs you might want to tinker with _symlinks_, CDK `core.Code.fromAsset.exclude` _glob patterns_, make a different use of Lambda Layers (the last one at your own peril!) or rethink the folders layout.

## What's Next

I think what I have is already in a decent enough shape to be shared but I won't consider this production ready yet. To close the gap some important pieces are missing, for example:

- add unit tests for the core (especially the `utils` lib)
- add monitoring/alerting
- run some security audit (e.g. review the _IAM roles and policies_ autogenerated by CDK)
- add a local testing environment to easily test Lambdas, and maybe a remote _staging_ one too
- add support for automatic deploys with `cdk deploy` run by a CI/CD pipeline
- introduce some state management to:
  - save the latest status update to avoid double submissions
  - keep a well formatted log of the _publish events_ (to be displayed via a web dashboard for example)
- add meta tags to the blog with a small size preview image to increase _clickability_
- ... let me know about **what you think** might be a _must to have_ for production

## Why Python

One might ask why not to choose some other runtime given that CDK offers a wide option of programming languages for our _Infra as Code_. Here I list few of the reasons why I think Python v3.8 **fits really well in this context**:

- the _standard library_ is [fully featured][antigravity] so usually very little dependencies are needed, in this case only `Boto3` (which is already bundled with the default Python Lambda runtime), `BeautifulSoup4` and `requests_oauthlib`. Less dependencies mean smaller memory footprint and code size, ease of maintenance and reduced risk of hidden (security) bugs
- the inheritance model is neat, for example the _OO pattern_ I followed in the [`utils.handlers`][src-handlers] library helps me to reason about that particular piece of logic in a way that I feel natural
- Python has been a _first class citizen_ in AWS Lambda land since it was initially released, the latest stable version (3.8.1) of the runtime is supported, and generally I bet it's a language that's going to stay relevant for long
- I'm used to dynamic typing but I find that the [`typing`][py-typing] built-in library is quite useful for properly documenting the core classes and methods while at the same time lets me free to use it only when and where it makes sense to me (to be more specific, it's not an _all or nothing_ choice like the one between JavaScript and TypeScript for example). Disclaimer: differently from statically typed languages it won't help you with correctness at runtime though.

## Conclusion

This was a really fun project to work on, it reminded me many times of the good old days when I used to spend massive amount of time just playing with those little LEGO© bricks.

Back to _now_, the more I get to know CDK (and AWS in general) the more I understand the huge potential for quickly developing robust, secure and massively scalable applications while having some fun along the way. Adding new AWS resources and dependencies with CDK is very straightforward so you don't have to waste time defining resources' details and can focus almost completely on the actual business logic of your application.

Speaking of the different building blocks offered by AWS nowadays, they are so many that I find it hard to believe anything to cover all the possible compute needs is missing; I'm sure there are such cases, I just haven't found them yet personally. I know for example lots of developers are asking for some kind of serverless _ElasticSearch_ offer, I won't be surprised if that's announced at one of the next [AWS re:Invent][reinvent] events: the rate at which new AWS features and services are released is truly astounding and it makes it harder and harder for who like me wants to keep up with the available options.

Finally, speaking of the _CDK abstractions considered harmful_ argument I can only say that, at least with a simple project like this, they deliver exactly what I'd expect: **eliminate code duplication** and seamlessly add **dependencies between stacks**. It's true there are still a few rough edges to be softened here and there (for example the [Lambda Layers dependency bug][bug-cf-layers] mentioned above, or this [about CloudWatch Alarms][bug-alarms] that I recently stumbled upon) but I see the project is quite active and I'm confident they'll be all fixed as the project becomes more mature.

As usual I'd like to close the write up reminding you that I'd love to **hear some feedback** (of ANY kind) from you, including suggestions on how to improve the codebase. Drop a message here below or [contact me directly][contact] if you prefer, I'm looking forward to hear your thoughts.

[2-legged-auth]:    <https://docs.microsoft.com/en-us/linkedin/shared/authentication/client-credentials-flow>
[antigravity]:      <https://xkcd.com/353/>
[BeautifulSoup4]:   <http://www.crummy.com/software/BeautifulSoup/bs4/>
[blog-0]:           <https://a.l3x.in/2016/02/23/sonos-spreaker.html>
[blog-1]:           <https://a.l3x.in/2020/01/29/my-quest-for-identity-in-software-engineering.html>
[blog-2]:           <https://a.l3x.in/2020/01/31/updating-curriculum-with-web-tech.html>
[blog-3]:           <https://a.l3x.in/2020/02/04/migrating-from-terraform-to-cdk.html>
[blog-abstract]:    <https://a.l3x.in/2020/02/04/migrating-from-terraform-to-cdk.html#general-reception>
[blog]:             <https://a.l3x.in/>
[bug-alarms]:       <https://github.com/aws/aws-cdk/issues/2089>
[bug-cf-layers]:    <https://github.com/aws/aws-cdk/issues/1972>
[cargo-cult]:       <https://en.wikipedia.org/wiki/Cargo_cult_programming>
[cdk-examples]:     <https://github.com/aws-samples/aws-cdk-examples>
[cdk-twitter]:      <https://greengocloud.com/2020/01/24/Build-a-Twitter-bot-with-AWS-Lambda-and-CDK/>
[contact]:          <https://a.l3x.in/contact.html>
[dev-to]:           <https://dev.to/shaftoe>
[example repo]:     <https://github.com/shaftoe/api-gateway-lambda-cdk-example>
[fb-disabled]:      <https://developers.facebook.com/docs/graph-api/reference/v6.0/user/feed>
[feedparser]:       <https://pythonhosted.org/feedparser/introduction.html#parsing-a-feed-from-a-remote-url>
[geocities]:        <https://gizmodo.com/remember-the-hilarious-horror-of-geocities-with-this-we-5983574>
[github-api]:       <https://developer.github.com/v3/>
[good-old-days]:    <https://eev.ee/blog/2020/02/01/old-css-new-css/>
[ha-feedreader]:    <https://github.com/home-assistant/home-assistant/pull/1836>
[Hacker news]:      <https://news.ycombinator.com/submitted?id=alexfortin>
[hackernews-ro]:    <https://blog.ycombinator.com/hacker-news-api/>
[home-assistant]:   <https://www.home-assistant.io>
[hootsuite]:        <https://hootsuite.com/>
[lack-of-faith]:    <https://imgflip.com/i/3pfgj4>
[layers-blog]:      <https://read.iopipe.com/cutting-through-the-layers-aws-lamba-layers-explained-28e8a8d7bda8>
[LinkedIn]:         <https://www.linkedin.com/in/alexanderfortin/>
[mastodon]:         <https://fosstodon.org/@alex>
[medium]:           <https://medium.com/@a_70064>
[oauth]:            <https://aaronparecki.com/oauth-2-simplified/>
[py-typing]:        <https://docs.python.org/3/library/typing.html>
[reddit]:           <https://www.reddit.com/user/AlexanderFortin>
[reinvent]:         <https://reinvent.awsevents.com/>
[repo]:             <https://github.com/shaftoe/api-l3x-in/tree/0.3.0>
[requests-oauth]:   <https://requests-oauthlib.readthedocs.io/>
[rss]:              <https://a.l3x.in/feed.xml>
[src-cdk]:          <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/cdk.py>
[src-devto]:        <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/stacks/publish_to_social/lambda/services/devto.py>
[src-handlers]:     <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/utils/handlers.py>
[src-helpers]:      <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/utils/helpers.py>
[src-layers]:       <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/stacks/lambda_layers/>
[src-publish-main]: <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/stacks/publish_to_social/lambda/publish_to_social.py>
[src-services]:     <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/stacks/publish_to_social/lambda/services/>
[src-stack-api]:    <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/stacks/api/__init__.py>
[src-stacks]:       <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/stacks/>
[src-utils-cdk]:    <https://github.com/shaftoe/api-l3x-in/blob/0.3.0/lib/utils/cdk.py>
[twitter]:          <https://twitter.com/alexanderfortin>
[Voight-Kampff]:    <https://www.youtube.com/watch?v=Umc9ezAyJv0>
