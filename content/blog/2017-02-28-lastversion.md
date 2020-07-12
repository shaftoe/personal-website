---
title: 'Lastversion: a Go serverless proof of concept developed on OpenWhisk'
tags:
  - docker
  - golang
  - openwhisk
  - serverless
---
It seems that recently every [OSS][1] tool I've [been][2] [using][3] [during][4] my working day (together with [many][5] [other][6] [cool][7] projects) is written in [Go][8], so I decided to teach myself a little bit of it having fun in the meanwhile, in the not-too-rare case I'll need to troubleshoot one of them, or simply understand better how it works. Unsurprisingly enough, the Net is full of [excellent documentation material][9] if you want to dig into Go programming without spending a single cent.

Generally I choose the next pet project trying to scratch an itch I already have, for example from time to time I want to know what's the latest stable version of one of the tools I use to have available on my workstation or on my servers in a programmatic way, so I decided to try to write a web service which will spare me the time of scraping the project's homepage in search of this precious information.

Thankfully, most of those projects I'm interested in are developed using Git with sources hosted by one of the main hosting platforms; they also tend to respect a [SemVer versioning scheme][10] (when you're lucky...) adding a git tag for each new release, so for those we can easily devise the biggest stable version reading the output of the [`git ls-remote`][11] command.

## Where to host? Go serverless!

I'm a big fun of the [serverless][12] movement, and a tiny web service like this seems to be a perfect fit for the paradigm, so having the service running on some server which is not managed by myself feels like the only way to go. At the time writing, the only serverless platform offering [good Go support (via Docker)][13] seems to be [Apache OpenWhisk][14] (hosted on [IBM Bluemix][15] cloud).

Developing on OpenWhisk turned out to be quite fun (a special thank to James Thomas for his [excellent][16] blog posts helping me getting started smoothly), and one of the advantages of being open source, is to have a [local development environment][17] running on a [Vagrant][18] box. As if this is not already enough to make it an appealing platform, [the community][19] around the project is incredibly welcoming and most importantly very helpful troubleshooting the issues you might encounter (for example I was confused by namespaces in Bluemix and I found prompt and helpful feedback on [the Slack channel][20] which clarified my confusion very quickly).

## Let's cUrl to the chase

[The result][21] of my tinkering is this publicly usable (and useless?) proof of concept:

{% highlight bash %}
$ curl https://lastversion.info/go
{
    "request": "go",
    "result": "1.8"
}

$ curl https://lastversion.info/terraform
{
    "request": "terraform",
    "result": "0.8.7"
}

# Non SSL available too
$ curl lastversion.info/lastversion
{
    "request": "lastversion",
    "result": "0.2.1"
}
{% endhighlight %}

An Nginx instance (external to Bluemix) is providing SSL termination and URL rewriting, but the backend is a (Bluemix hosted) OpenWhisk action behind an OpenWhisk API gateway, consumable directly using the Bluemix endpoint:

{% highlight bash %}
$ wsk action list | grep /lastversion

$ wsk api-experimental list | grep /lastversion
https://cfdbfa25-8630-4e9d-8b98-067de61009a0-gws.api-gw.mybluemix.net/lastversion/v1

$ curl https://cfdbfa25-8630-4e9d-8b98-067de61009a0-gws.api-gw.mybluemix.net/lastversion/v1?project=kubernetes
{
    "request": "kubernetes",
    "result": "1.5.3"
}
{% endhighlight %}

The [project homepage][21] is hosted on GitHub where you could also [have a look at the source code][21], leave comments or open issues or pull requests. It has no ambition of being neither complete nor especially useful, but it might give you some hints if you're starting fresh on OpenWhisk (have a look at the `build.sh` script for examples on how to interact with the [OpenWhisk CLI][22]).

As a side note, if you develop on MacOS platform, you might also want to install the OpenWhisk `wsk` [CLI tool][22] using [Homebrew][23] and [this formula][24] I wrote] when I started to work on this project. EDIT: I've been told that on MacOS the suggested way to prototype on OpenWhisk is [documented here][26], I didn't try it yet but you might want to start from there instead.

## What's next

I'm already quite satisfied with the result considering that the only goal was to start writing Go and to learn how to deploy publicly accessible actions on OpenWhisk, but if I'll find time and will (or help) those would be some of the things I'd like to see improved:

- remove the self hosted Nginx from the stack (which is providing SSL termination and URL rewriting) to make it a 100% serverless solution
- remove the statically linked Git binary using a pure Go implementation of `git ls-remote`
- add support for most of the active and popular OSS projects
- add support for non-SemVer versions
- add other useful(?) features based on users request if any

Follow [me on Twitter][25] if you want to get updates on my technical experiments with both Go and OpenWhisk, or get+stay in touch.

[1]: https://en.wikipedia.org/wiki/Open-source_software_movement
[2]: https://www.terraform.io/
[3]: https://www.docker.com/
[4]: https://www.packer.io/
[5]: https://kubernetes.io/
[6]: https://prometheus.io/
[7]: http://grafana.org/
[8]: https://golang.org/
[9]: https://github.com/golang/go/wiki/Learn
[10]: http://semver.org/
[11]: https://git-scm.com/docs/git-ls-remote.html
[12]: https://en.wikipedia.org/wiki/Serverless_computing
[13]: http://jamesthom.as/blog/2017/01/16/openwhisk-docker-actions/
[14]: http://openwhisk.org/
[15]: https://www.ibm.com/blogs/bluemix/2017/01/docker-bluemix-openwhisk/
[16]: http://jamesthom.as/blog/2017/01/17/openwhisk-and-go/
[17]: https://github.com/openwhisk/openwhisk/tree/master/tools/vagrant
[18]: https://www.vagrantup.com/
[19]: http://openwhisk.org/faq
[20]: http://slack.openwhisk.org/
[21]: https://github.com/shaftoe/lastversion
[22]: https://console.ng.bluemix.net/openwhisk/cli
[23]: https://brew.sh/
[24]: https://github.com/shaftoe/homebrew-wsk
[25]: https://twitter.com/alexanderfortin
[26]: https://github.com/openwhisk/openwhisk/tree/master/tools/macos
