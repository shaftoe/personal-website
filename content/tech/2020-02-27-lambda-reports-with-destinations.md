---
title: An AWS Lambda execution report webpage built with Lambda Destinations, CDK and Svelte
description: Moving from a previous CDK article I expand the publish-to-social code base to add a nice report functionality. In this article I show you how easy it is to introduce Lambda Destinations in your CDK project and make use of them for this particular use case. For the frontend part I use Svelte web framework to present the Lambda report JSON output as web page content.
categories:
  - aws
  - cdk
  - lambda
  - svelte
  - web
---

Until recently the only built-in way to programmatically react to AWS Lambda asynchronous execution (failures) was the [_dead letter queue_][aws-dead-letter] feature. This was suboptimal to say little because for example it didn't give developers any way to programmatically act upon Lambda _successes_ leaving us with only a few convoluted options like parsing _CloudWatch Logs_ events.

To fill that gap AWS recently announced [Lambda Destinations][lambda-dest]. Quoting from the announcement post:

> With Destinations, you can route asynchronous \[Lambda\] function results as an execution record to a destination resource without writing additional code. An execution record contains details about the request and response in JSON format including version, timestamp, request context, request payload, response context, and response payload. For each execution status such as Success or Failure you can choose one of four destinations: another Lambda function, SNS, SQS, or EventBridge. Lambda can also be configured to route different execution results to different destinations.

At first sight it might not sound like a big deal but to me it represents a truly interesting feature that opens up a wide new range of possibilities.

## TL;DL

For the ones of you who're in a hurry, you can inspect the [final result here][social-report] and [the required][code-change-1] code [changes  here][code-change-2].

## Feature Request

As announced in a [previous post][blog-1] about CDK and the `publish-to-social` _stack_, I had in mind some improvements for the project before considering it feature complete and tag it as `v1.0.0`.

One of the missing pieces was an easy way to visualize the actual successful execution of each publishing Lambda, anything handier than opening the AWS web console in search of _CloudWatch Logs_ entries.

I already heard about _Lambda Destinations_ but I haven't had the chance yet to actually make use of them so this case sounded like the perfect match to try out the new feature.

## Implementation

### Backend

If we ignore the automatically generated Lambda _CloudWatch Logs_ which are meant more for debugging and troubleshooting, some kind of storage mechanism to persist the publishing events was missing in the initial `publish-to-social` version so, after spending a while considering what might be the best option in this case, I settled for a single _CloudWatch LogGroup_ as container for `<social-name>` _LogStreams_, one for each Lambda publisher (`twitter`, `mastodon`, etc...).

Another option I considered was a _DynamoDB_ table but I ruled that out for a few reasons, mostly because it's arguably overkill for this use case (e.g. I have zero need for high scalability nor making complex queries nor of any other powerful feature that _Dynamo_ provides).

To glue all the parts together these addition were needed:

- a single new _CloudWatch LogGroup_ (line 55) and a new _Stream_ for [each publisher][src-cloudwatch] (line 80)
- a [new Lambda][src-new-lambda] that generates log entries (with metadata like `url`, `title`, `timestamp`, etc.) into the _CW Log Streams_ mentioned above to be used as _destination_ by all the Lambda publishers
- a [new route][src-api] (`GET /social_report`, line 70) in the `api` Lambda that reads the new _CloudWatch Logs_ data and returns it to the web client as JSON response

The (slightly simplified) final backend architecture looks like this:

[![Architecture Diagram]({{ "/img/lambda-destination-diagram.svg" }}){: .img-fluid }](/img/lambda-destination-diagram.svg "Click to view it bigger")

### Frontend

For the frontend side of things I decided to just add a new page to this very [Jekyll][jekyll] blog and have it publicly available [at this URL][social-report].

As a side note, I already have plans to migrate the blog from Jekyll to [Hugo][hugo] so I didn't invest too much on the page layout design at this time.

For the dynamic part I could have added some [good old _jQuery_][jquery] given that it's already been used for the [`contact`][contact] page... but why on Earth should I do that when there are so many new fancy web frameworks out there to be tried out? 😀

In the last years I've been following the [_Vue.js_][vue] project and I still consider it a very good choice for developing _SPA_ and the like but since a while [_Svelte_][svelte] keeps constantly popping up in my news feeds. This simple use case felt like the perfect chance to get started and see how _Svelte_ differs from _Vue_ (and others) approach.

Actually I must say I'm quite happy with the choice: the examples from the [official documentation][svelte-examples] get you up to speed very fast so I was able to quickly add the needed simple functionality with just around 70 lines of code (including Javascript and markup template).

This is the main `.svelte` file content:

```js
<script>
    let done    = false
    let error   = null
    let socials = {}

    const URL     = "https://api.l3x.in/social_report"
    const request = new Request(URL)

    function hideSpinner() { document.querySelector("#spinner").style.display = "none" }

    fetch(request).then(function (response) {
        if (!response.ok) {
            error = response.status
            hideSpinner()

        } else {
            response.json().then(function (body) {
                const message = body["message"]
                socials = Object.keys(message)
                                .map(social => [social, message[social]
                                .map(entry => JSON.parse(entry["message"]))])
                done = true
                hideSpinner()
            })
        }
    })
</script>

{#if error }
<h1 class="alert alert-danger text-center" role="alert">Error { error }</h1>

{:else if done }
<h1 class="text-center">Publish-to-Social Events</h1>
    <ul class="p-0">
    {#each socials as [social, entries]}
        <li class="mt-3 list-unstyled">
            <h2>{ social }</h2>
            {#if entries}
            <ul class="p-0">
                {#each entries as entry}
                <li class="card p-0">
                    <div class="card-body">
                        <p class="card-title">
                            <em>{ entry.timestamp }</em>
                        </p>

                        <p>
                            <strong>{ entry.title }</strong>
                        </p>

                        <p>
                            <a
                                href={ entry.url }
                                alt={ entry.title }
                            >
                                { entry.url }
                            </a>
                        </p>
                    </div>
                </li>
                {/each}
            </ul>
            {:else}
            <div class="card">
                <span class="card-body">
                    <h2 class="text-center">No Entries</h2>
                </span>
            </div>
            {/if}
        </li>
    {/each}
    </ul>
{/if}
```

## Conclusion

AWS _Lambda Destinations_ are truly powerful and easy to introduce to your existing Lambda-based application which means the temptation to use them to hammer out any nail you find is strong. My recommendation is to resist that temptation and use them only after analyzing your context and deciding if it truly makes sense in your scenario.

The one use case I showed in this article is one example where I believe they are the right tool for the job and I can already think of some more (sending notifications, generating analytics data, etc), but for more complex workflows you might also want to consider [AWS Step Functions][step-functions] for example.

In general working with AWS CDK is a real pleasure and this time was no different. The code changes required to add the functionality were minimal and all quite straightforward (most notable [the addition][code-change-3] of a `on_success` parameter to the Lambda _builder_ utility function at line 61).

Finally, _Svelte_ is a very interesting project that's quickly gaining traction and adoption. Even though I just scratched the surface of what's possible with _Svelte_ I already got the feeling that it might be a very good fit at least for developing simple web applications, while for something more complex so far I still believe _Vue.js_ (combined to _Vuex_ and _vue-router_ and all the available plugins and community resources) might be a better choice. That said, I don't know _Svelte_ well enough yet to make a final call so for now I'll keep both frameworks ready and warm in my toolbox.

As usual I encourage you to **leave some comments** here below or [contact me directly][contact], I'm eager to know what YOU think!

[aws-dead-letter]: <https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#dlq>
[blog-1]:          <https://a.l3x.in/2020/02/17/serverless-publish-to-multiple-social-media.html>
[code-change-1]:   <https://github.com/shaftoe/api-l3x-in/commit/cbee2277769ab5c0faa70c41da350f634e7dd89f>
[code-change-2]:   <https://github.com/shaftoe/api-l3x-in/commit/231cf3d4a48430e40f1d6ba867f0bf6a25effc4e>
[code-change-3]:   <https://github.com/shaftoe/api-l3x-in/commit/cbee2277769ab5c0faa70c41da350f634e7dd89f#diff-ed125120b8ad788adf97794a030d9a28>
[contact]:         <https://a.l3x.in/contact.html>
[hugo]:            <https://gohugo.io/>
[jekyll]:          <https://jekyllrb.com/>
[jquery]:          <https://jquery.com/>
[lambda-dest]:     <https://aws.amazon.com/blogs/compute/introducing-aws-lambda-destinations/>
[social-report]:   <https://a.l3x.in/social_report.html>
[src-api]:         <https://github.com/shaftoe/api-l3x-in/commit/231cf3d4a48430e40f1d6ba867f0bf6a25effc4e#diff-a6106f3ba5d31abaac0d36868c5d3c8b>
[src-cloudwatch]:  <https://github.com/shaftoe/api-l3x-in/commit/cbee2277769ab5c0faa70c41da350f634e7dd89f#diff-0613394a130107efae9febd83cd07271>
[src-new-lambda]:  <https://github.com/shaftoe/api-l3x-in/commit/cbee2277769ab5c0faa70c41da350f634e7dd89f#diff-9544ce79911d315dcdc0ed497cb6f33e>
[step-functions]:  <https://aws.amazon.com/step-functions/>
[svelte-examples]: <https://svelte.dev/examples>
[svelte]:          <https://svelte.dev/>
[vue]:             <https://vuejs.org/>
