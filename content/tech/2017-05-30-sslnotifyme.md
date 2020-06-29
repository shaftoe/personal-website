---
title:  "sslnotify.me - yet another OpenSource Serverless MVP"
tags:
  - aws
  - lambda
  - openwhisk
  - python
  - serverless
  - ssl
  - terraform
---
After ~10 years of experience in managing servers at small and medium scales, and despite the fact that I still love _doing sysadmin stuff_ and I constantly try to learn new and better ways to approach and solve problems, there's one thing that I think I've learned very well: it's hard to get the operation part right, _very_ hard.

Instead of dealing with not-so-interesting problems like patching critical security bugs or adding/removing users or troubleshooting obscure network connectivity issues, what if we could just cut to the chase and invest most of our time in what we as engineers are usually hired for, i.e. solving non-trivial problems?

## TL;DL - try the service and/or check out the code

[sslnotify.me][1] is an experimental web service developed following the Serverless principles. You can inspect all the code needed to create the infrastructure, deploy the application, and of course the application itself on [this GitHub repository][2].

## Enter Serverless

The Serverless trend has been the last to join the list of paradigms which are supposedly going to bring ops bliss into our technical lives. If Infrastructure as a Service didn't spare us from the need of operational work (sometimes arguably making it even harder), nor Platfrom as a Service was able to address important concerns like technical lock-in and price optimization, Function as a Service is brand new and feels like a fresh new way of approaching software development.

These are some of the points I find particually beneficial in FaaS:

- *very* fast prototyping speed
- sensible reduction in management complexity
- low (mostly zero while developing) cost for certain usage patterns
- natual tendency to design highly efficient and scalable architectures

This in a nutshell seems to be the FaaS promise so far, and I'd like to find out how much of this is true and how much is just marketing.

## Bootstrapping

The Net is full of excellent documentation material for who wants to get started with some new technology, but what I find most beneficial to myself is to get my hands dirty with some real project, as I [recently did with Go and OpenWhisk][3].

Scratching an itch also generally works well for me as source of inspiration, so after issuing a [Let's Encrypt][8] certificate for [this OpenWhisk web service][4] I was toying with, I thought would be nice to be alerted when the certificate is going to expire. To my surprise, a Google search for such a service resulted in a list of very crappy or overly complicated web sites which are in the best case hiding the only functionality I needed between a bloat of other services.

That's basically how [sslnotify.me][1] was born.

## Choosing the stack

The purpose of the project was yes to learn new tools and get some hands on experience with FaaS, but doing so in the simpliest possible way (i.e. following [KISS principle][5] as much as possible), so keep in mind that many of the choices might not necessary be the "best" nor most efficient nor elegant ones, they are representative of what looked like the simpliest and most straightforward option to me while facing problems while they were rising.

That said, this is the software stack taken from the project README:

- [Chalice framework](http://chalice.readthedocs.io/) - to expose a simple REST API via AWS API Gateway
- Amazon Web Services:
    - Lambda (Python 2.7.10) - for almost everything else
    - DynamoDB (data persistency)
    - S3 (data backup)
    - SES (email notifications)
    - Route53 (DNS records)
    - CloudFront (delivery of frontend static files via https, redirect of http to https)
    - ACM (SSL certificate for both frontend and APIs)
    - CloudWatch Logs and Events (logging and reporting, trigger for batch jobs)
- Bootstrap + jQuery (JS frontend)
- Moto and Py.test (unit tests, work in progress)
 
I know, at first sight this list is quite a slap in the face of the beloved KISS principle, isn't it? I have to agree, but what might seem an over complication in terms of technologies, is in my opinion mitigated by the almost-zero maintenance and management required to keep the service up and running. Let's dig a little more into the implementation details to find out.

## Architecture

[sslnotify.me][1] is basically a daily monitoring notification system, where the user can subscribe and unsubscribe via a simple web page to get email notifications if and when a chosen SSL certificate is expiring before a certain amount of days which the user can also specify.

Under the hoods the JS frontend interacts with the backend available at the `api.sslnotify.me` HTTPS endpoint to register/unregister the user and to deliver the feeedback form content, otherwise polls the [sslexpired.info][6] service when the user clicks the _Check now_ button.

The actual SSL expiration check is done by [this other service][6] which I previously developed with [OpenWhisk][9] and deployed on IBM Bluemix platform, in order to be used indipendently as a validation backend and to learn a bit more of Golang along the way, but that's for another story...

The service core functionality can be seen as a simple _daily cronjob_ (the `cron` lambda triggered by CloudWatch Events) which sets the things in motion to run the checks and deliver notifications when an alert state is detected.

To give you a better idea of how it works, this is the sequence of events behind it:
- a CloudWatch Event invokes the `cron` lambda async execution (at 6:00 UTC every day)
- `cron` lambda invokes `data` lambda (blocking) to retrieve the list of users and domains to be checked
- `data` lambda connects to DynamoDB and get the content of the user table, sends the content back to the invoker lambda (`cron`)
- for each entry in the user table, `cron` lambda asyncrounosly invokes one `checker` lambda, writes an OK log to the related CloudWatch Logs stream, and exits
- each `checker` lambda executes indipendently and concurrently, sending a GET request to the [sslexpired.info][6] endpoint to validate the domain; if no alert condition is present, logs OK and exits, otherwise asyncrounosly invokes a `mailer` lambda execution and exits
- any triggered `mailer` lambda runs concurrently, connects to the SES service to deliver the alert to the user via email, logs OK and exits

Beside the main cron logic, there are a couple of other simpler cron-like processes:

- a daily `reporter` lambda, collecting logged errors or exceptions and bounce/feedback emails delivered (if any) since the day before, and sending me an email with the content (if any)
- an hourly backup of the DynamoDB tables to a dedicated S3 bucket, implemented by the `data` lambda

## Challenges

Everyone interested in Serverless seems to agree on one thing: being living its infancy it is still not very mature, especially in regards of tooling around it. Between other novelties, you'll have to understand how to do logging right, how to test properly, and so on. It's all true, but thankfully there's a lot going on on this front, frameworks and tutorials and hands-on and whitepapers are popping up at a mindblowing rate and I'm quite sure it's just a matter of time before the ecosystem makes it ready for prime time.

Here though I'd like to focus on something else which I found interesting and suprisingly to me not that much in evidence yet. Before starting to getting the actual pieces together, I honestly underestimated the complexity that even a very very simple service like this could hide, not much in the actual coding required (that was the easy part) but from the infrastructure setup perspective, so I actually think that what's in the [Terraform file][7] here is the interesting part of this project that might be helpful to whoever is starting from scratch.

For example, take setting SES properly, it is non trivial _at all_, you have to take care of DNS records to make DKIM work, setup proper bounces handling and so on, and I couldn't find that much of help just googling around, so I had to go the hard way, i.e. reading in details the AWS official documentation, which sometimes unfortunately is not that exhaustive, especially if you plan to _do things right_, meaning hitting the APIs in a programmatic way instead of clicking around the web console (what an heresy!) as shown in almost every single page of the official docs.

One thing that really surprises me all the time is how broken are the security defaults suggested there. For example, when setting up a new lambda, docs usually show something like this as policy for the lambda role:

{% highlight json %}
{
    "Version": "2012-10-17",
    "Statement": [
        {
        "Effect": "Allow",
        "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams"
        ],
        "Resource": [
            "arn:aws:logs:*:*:*"
        ]
        }
    ]
}
{% endhighlight %}

I didn't check but I think it's what you actually get when creating a new lambda from the web console. Mmmm... read-write permission to ANY log group and stream... seriously? Thankfully with Terraform is not that hard to set lambdas permission right, i.e. to create and write only to their dedicated stream, and in practice it looks something like this:

{% highlight terraform %}
data "aws_iam_policy_document" "lambda-reporter-policy" {

statement {
    actions = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
    ]

    resources = ["${aws_cloudwatch_log_group.lambda-reporter.arn}"]
}

[...]
{% endhighlight %}

Nice and clean, and definitely safer. For more details on how Terraform was used, you can find [the whole setup here][7]. It's also taking care of crating the needed S3 buckets, especially the one for the frontend which is actually delivered via CloudFront using our SSL certificate, and to link the SSL certificate to the API backend too.

Unfortunately I couldn't reduce to zero the 'point and click' work, some was needed to validate ownership of the [sslnotify.me][1] domain (obviously a no-go for Terraform), some to deal with the fact that CloudFront distributions take a very long time to be in place.

Nevertheless, I'm quite happy with the result and I hope this could help who's going down this path to get up to speed quicker then me. For example, I was also suprised not to find any tutorial on how to setup an HTTPS static website using cloud services: lots for HTTP only examples, but with [ACM][10] and [Let's encrypt][8] out in the wild and totally free of charge, there's really no more excuse for not serving HTTP traffic via SSL in 2017.

## What's missing

The more I write the more I feel there's much more to say, for example I didn't touch at all the frontend part yet, mostly because I had almost zero experience with CSS, JS, CORS, sitemaps, and holy moly how much you need to know just to get started with something so simple... the web party is really hard for me and thankfully I got great support from some very special friends while dealing with it.

Anyway, this was thought as an MVP (minimum viable product) from the very beginning, so obviously there's a huge room from improvement almost everywhere, especially on the frontend side of the fence. If you feel like giving some advise or better patch the code, please don't hold that feeling and go ahead! I highly value any feedback I receive and I'll be more then happy to hear about what you think about it.

## Conclusion

I personally believe Serverless is here to stay and, it's fun to work with, and the event driven paradigm pushes you to think on how to develop highly efficient applications made up of short lived processes, which are easy to be scaled (by the platform, without you moving a finger) and naturally adapt to usage pattern, with the obvious benefits of cost reduction (you pay for the _milliseconds_ your code is executed) and almost zero work needed to keep the infrastructure up and running. The platform under the hood is now taking care of provisioning resources on demand and scaling out as many parallel lambda executions as needed to serve the actual user load; on top of this (or, better, on the bottom of it) built-in functionalities like DynamoDB TTL fileds, S3 objects lifecycles or CloudWatch logs expirations spare us from the need of writing the same kind of scripts, again and again, to deal with basic tech needs like purging old resources.

That said, _keeping it simple_ is in practice very hard to follow, and this case was no different. It's important not to get fooled into thinking FaaS is the panacea to every complexity pain, because it's not the case (and this is valid as a general advise, you can replace FaaS with any _cool tech_ out there and still stands true). There are still many open questions and challenges waiting down the road, for example setting up an environment in a safe and predictible way is not as easy as it may look at a first sight, even if you're an experienced engineer; there are lots of small details you'll have to learn and figure out in order to make all the setup rock solid, but it's definitely doable and worth the initial pain of going through pages and pages of documentation. The good part is that it's very easy to start experimenting with it, and the generous free tiers offered by all the cloud providers make it even easier to step in.

## What's next

Speaking of free tiers, the amazing 300USD Google Compute Cloud credit, together with the enthusiasm of some friend already using it, convinced me to play with this amazing toy they call [Kubernetes][11]; let's see if I'll be able to come up with something interesting to share, given the amount of docs and tutorials out there I highly doubt that, but never say never. Till the next time... try Serverless and have fun with it!

[1]: https://sslnotify.me/
[2]: https://github.com/shaftoe/sslnotifyme/ "GitHub repository"
[3]: http://alexanderfortin.tumblr.com/post/157820499911/lastversion-a-go-serverless-proof-of-concept "Yet another serverless blog post from me"
[4]: https://lastversion.info/ "lastversion.info"
[5]: https://en.wikipedia.org/wiki/KISS_principle "KISS principle"
[6]: https://sslexpired.info/ "SSL Expired service"
[7]: https://github.com/shaftoe/sslnotifyme/blob/master/infra/terraform.tf "terraform file content"
[8]: https://letsencrypt.org/ "Let's encrypt"
[9]: http://openwhisk.org/ "OpenWhisk"
[10]: https://aws.amazon.com/certificate-manager/ "AWS ACM"
[11]: https://kubernetes.io/ "Kubernetes"
