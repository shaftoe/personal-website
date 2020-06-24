---
title: "Introducing AWS CDK with a real life Lambda and API gateway example"
description: "After successfully replacing Terraform with CDK in a real life project I take the chance to wrap up the new knowledge along with some Terraform vs. CDK kind of considerations. I also synthesize the acquired know-how in a mini tutorial based on the actual code used in the production scenario."
categories:
  - api
  - aws
  - cdk
  - python
  - serverless
  - terraform
  - terraform
---

Amazon Web Services [recently announced][announcement] a new tool meant to ease the management of AWS resources in a fully programmatic way: **AWS Cloud Development Kit** (**CDK** for short).

As stated in the [project homepage][homepage]:

> [_CDK is_] an open source software development framework to model and provision your cloud application resources using familiar programming languages.

To me it represents a welcome addition to the likes of [AWS SAM](https://aws.amazon.com/serverless/sam/) and HashiCorp's [Terraform](https://www.terraform.io/), extending the realm of what's possible today with _Infrastructure as Code_ (IaC) on AWS.

It's also introducing a new paradigm compared to other DSL-based tools, i.e. write _Infra as Code_ in your favorite popular OO language, together with some interesting new features that weren't available until now (more on these later).

CDK is available in different popular programming languages like TypeScript (used as default for the examples in the official developer guide), JavaScript, Python (the one I use in my mini tutorial), C#/.NET and Java.

## What is CDK

From a practical standpoint, CDK is a Node.js application coupled with a bunch of packaged libraries that let you design, deploy and manage your AWS resources in a programmatic way.

As you might expect from such a tool, you can define resources and interconnect them in dependency chains letting you leverage powerful abstractions (I'll discuss briefly about pros and cons of using abstractions [in another chapter](#general-reception)) and enforce various best practices out of the box.

For example one of the most welcome features for me is that it removes almost completely the tedious task of properly defining (and attaching) IAM resources.

Behind the scenes, when a CDK app is executed, it creates (**synthesizes** in CDK parlance) a model of the infrastructure the user has defined in code leveraging CDK primitives.

If no errors are found (wrong syntax, missing imported libraries, etc.) it generates an artifact (_synth_ phase) that is used as input by an AWS CloudFormation CLI process. CloudFormation will then be responsible for provisioning (_deploy_ phase) the actual resources in AWS.

The latter point doesn't mean you need to run CloudFormation CLI manually (even if you could just stop at the _synth_ phase and use the CFN artifacts as you wish), just that CDK main process doesn't interact directly in the creation/destruction of resources and it's basically oblivious to what's happening while waiting for CloudFormation to be done.

For example you can't add any _if this fails, than_ kind of logics but I don't think this is a unhealthy limitation to have, nor the other mentioned tools provide this kind of possibility as far as I know.

## Why CDK

CDK is not only the CLI tool and libraries, it's a new take on the whole idea of defining AWS resources all-together. The tool is so powerful it makes you truly feel the sky is the only limit.

For example, one idea that I'm already toying around is to have a reusable _stack_ that makes it dumb simple to have Lambda outputted errors delivered to some (easily replaceable) notification service of choice, together with proper alarms in place, and so on. If done right in future CDK projects should be possible to just pass this hypothetical _errors delivery_ stack as a property to pass to new stacks and have the functionality automatically applied in their scope.

If I get it right, **the most ambitious goal** of CDK is to make these kind of abstractions the common **way of thinking** about your AWS-based projects, all while transparently enforcing best practices like modularity, security, and so on.

One of the common troubles when defining infrastructure as code in AWS has been the tedious task of writing CloudFormation templates by hand. Tools like Terraform and SAM ease that burden but they generally lack the unlimited flexibility provided by CDK.

It's true, since long we could use libraries [like Boto](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html) to interact programmatically with AWS resources. So far though we were lacking a general purpose framework that saved us from the burden of implementing a dependency graph, or writing a lot of IAM boilerplate, or enforcing _least privilege principle_ all the time, and so on.

## Getting started

General availability for TS and Python has been [announced](https://aws.amazon.com/about-aws/whats-new/2019/07/the-aws-cloud-development-kit-aws-cdk-is-now-generally-available1/) not long ago but to my surprise I found there's already a good amount of (official and not) resources to quickly get up and running with CDK.

As a side note, I got to know about CDK in the first place via this [YouTube feed](https://www.youtube.com/user/AWSwebinars). I then moved my first steps from the official [getting started](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) documentation and subsequently landed on the excellent workshop at <https://cdkworkshop.com>.

## Core concepts

In the following paragraphs I list the basic CDK concepts needed to get started with a simple project like the one used in the tutorial:

### constructs

Constructs are the main building blocks you're going to define with CDK. From the [official docs](https://docs.aws.amazon.com/cdk/latest/guide/constructs.html):

> Constructs are the basic building blocks of AWS CDK apps. A construct represents a "cloud component" and encapsulates everything AWS CloudFormation needs to create the component.
>
> \[...\]
>
> For example, a central team can define a construct that implements the company's best practice for a DynamoDB table with backup, global replication, auto-scaling, and monitoring, and share it with teams across a company or publicly
>
> \[...\]
>
> AWS constructs make least-privilege permissions easy to achieve by offering simple, intent-based APIs to express permission requirements.
>
> \[...\]
>
> AWS constructs are designed around the concept of "sensible defaults."

Follows a code example from my tutorial.

[`src/stack.py`][stack-py]:

```python3
from os import environ
from aws_cdk import (
    [...]
    aws_certificatemanager,
)

[...]

cert = aws_certificatemanager.Certificate(
    self,
    '{}-certificate'.format(environ['CDK_APP_NAME']),
    domain_name=environ['CDK_BASE_DOMAIN'],
)
```

### stacks

A [Stack](https://docs.aws.amazon.com/cdk/latest/guide/stacks.html) is an abstraction that helps in grouping resources:

> All AWS resources defined within the scope of a stack, either directly or indirectly, are provisioned [_by CloudFormation_] as a single unit.

In our example we make use of a single stack but we could define more in our application. Refer to [the docs](https://docs.aws.amazon.com/cdk/latest/guide/stacks.html) if you want to know more.

A code example from the tutorial:

[`src/stack.py`][stack-py]:

```python3
class ApiStack(core.Stack):  ## Stack class definition

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        ### the constructs belonging to the scope of ApiStack follow below...
```

### identifiers

[Identifiers](https://docs.aws.amazon.com/cdk/latest/guide/identifiers.html) are the labels we give to our resources:

> Identifiers must be unique within the scope in which they are created; they do not need to be globally unique in your AWS CDK application

The list above is by no any means exhaustive, I suggest you to read the [documentation](https://docs.aws.amazon.com/cdk/latest/guide/core_concepts.html) to get acquainted with all the other CDK core concepts.

## Best practices

CDK is relatively new so it's too early to discuss thoroughly about best practices, as usual they should emerge in time (assuming of course that the tool will gain adoption and stay relevant).

I found this interesting one in [the docs](https://docs.aws.amazon.com/cdk/latest/guide/apps.html) though:

> Generally, we recommend that you perform validation as soon as possible (usually as soon as you get some input) and throw exceptions as early as possible.

I also dare adding a related recommendation: add constructs iteratively and frequently test syntax and semantics running `cdk diff`. This will help you identify problems early on sparing you from debugging complex mixed code exceptions (both Node.js and Python in my case).

## Tutorial: migrate Lambda and API Gateway from Terraform to CDK

Enough talk, about time to see something practical.

In this [mini tutorial][tutorial] we see how to make use of CDK to connect both a Lambda and an ACM SSL certificate to a (CORS enabled) API Gateway, so to be able to trigger a synchronous Lambda execution via an unauthenticated POST request to an HTTPS endpoint like `https://api.mydomain.com/`.

The code in the tutorial is currently used for a real backend that receives POST data from an HTML form and (in absence of errors) delivers the message content to a 3rd party API messaging service. You can find [more details][tutorial] about both architecture and implementation in the README.

As a side note, the migration that gave birth to this mini-tutorial was relatively simple and went very smoothly, with **all the functionalities** replicated in a new AWS region without any downtime for the API service.

It also brought significant reduction in the amount of code required for the exact **same AWS setup** (_almost_ exact to be precise: CDK introduced a few new CloudFormation and S3 resources that were not there):

```bash
# OLD SETUP
$ wc -l infra/* src/* Makefile
  121 infra/api-gateway.tf
   58 infra/lambda.tf
   24 infra/main.tf
    4 infra/versions.tf
   97 src/lambda.py
   19 Makefile
  323 total

# NEW SETUP
$ wc -l lambda/* src/* Makefile
   92 lambda/contact_us.py
   20 src/app.py
   54 src/stack.py
   51 Makefile
  217 total
```

If we consider only _Infra as Code LoC_ the simplification is even more evident:

```bash
# OLD SETUP
$ wc -l infra/*
  121 infra/api-gateway.tf
   58 infra/lambda.tf
   24 infra/main.tf
    4 infra/versions.tf
  207 total

# NEW SETUP
$ wc -l src/*
  20 src/app.py
  54 src/stack.py
  74 total
```

I know, _Lines of Code_ is a rough indicator that doesn't tell the full story about complexity but it's common belief that less code means less surface for introducing bugs and less data to have stacked in your mind while coding. Personally I find the CDK code very easy to read but I'm a long time Python developer so it's hard for me to tell how much my bias is involved in this judgement.

## Pros and Cons

I haven't had enough time yet to properly experiment with CDK, adopting it for new projects (where it makes sense) will help me grow a better understanding of the tool and give a better informed opinion about it.

That said, I list here some of the pros and cons that I noticed so far:

### pros

- very powerful and flexible
- sane and secure defaults
- DRY-friendly
- built-in support for multi-region, multi-account and multi-environment (_dev_, _prod_, etc) setups
- support for popular languages may get you (and/or other team members) quickly up to speed
- _physical_ resource names (e.g. an actual S3 bucket name) are name-spaced to avoid name clashes, making it much easier to manage global resources (e.g. S3) in multi-region/multi-account setups
- custom resources enhanced [reusability][reusability]:
  > "[...] wrap them up into a regular construct interface, so from another user's perspective the feature feels native".
- AWS has grown a reputation for maintaining products and services for long (actually I'm not aware of _any_ AWS product that has been discontinued) which should make investing in CDK a safer bet compared to other _Open Source_ tools that have no powerful company on their back and might disappear from the radar if not properly financed
- nice to have features like apply tags recursively to all children _constructs_

### cons

- not cloud agnostic: works only on AWS
- it feels like it's still in early stage of development, e.g.:
  - CloudFormation APIs are not 100% covered yet
  - links to examples [are disappearing][stack-overflow-link] and/or changing URL
  - documentation could definitely be improved adding more examples on common scenarios and best practices
- inflexible (and AFAIK unavoidable) way of setting up new projects
- it's reasonable to believe at least some of CDK metadata files (kept in the `<app_name>/cdk.out` folder) should be managed in the way `terraform.tfstate` files need to be. Currently there's no built-in support for decentralization (for example in the way Terraform is doing supporting S3 buckets and other backends), making it harder to fit in a CI/CD pipeline for example
- minor: `cdk destroy` leaves [some leftovers][leftovers] in CFN and CloudWatch Logs that need to be deleted manually

## TF vs CDK... FIGHT!

I'm a HashiCorp's products user since the early _Vagrant_ days. Terraform in particular has been one of my favorite tools and I've been using it for quite some time now.

To clear up any doubt, I'm **not planning to drop TF** any soon nor to replace it with CDK in *any* new project.

Even if I focus mainly on AWS, now and then I need to interact with other service providers which is obviously not doable with CDK, and this blocker is already enough to keep Terraform safe and warm in the toolbox.

That said, I like _very much_ the way CDK is doing a lot of heavy lifting that TF does not when setting up VPC or IAM resources for example. The boilerplate reduction is consistent as it is the reduction of security risks not having to write IAM policies by hand.

Disclaimer: I trust AWS developers here, personally I haven't dug much into the actual soundness of any of the IAM setup CDK automatically generated for me. IAM correctness is described multiple times in the docs as a strong selling point though and I think it's reasonable to believe it. **Double checking IAM** policies and roles before going to production **is always a good idea** though, regardless of how IAM resources were defined.

Finally, I'm undecided yet how the _object oriented_ approach maps the domain compared to something more declarative like the Terraform DSL. In the past (before the [Serverless epiphany][blog-post] struck me...) I made extensive daily use of [Puppet][puppet] and generally thought that using declarative code for defining system/infrastructure setups helped in maintaining and reasoning about the codebase in general, about resources' interdependencies in particular.

In practice though declaring resources in hierarchical order doesn't feel much of a limitation given that's how I'm used to think about the infrastructure anyway (i.e. _first_ I create an Ec2 VPC, _then_ I add an ECS cluster to it, _then_ I add a tasks definition to the ECS cluster, _etc.._ ).

I briefly discussed the topic with a good friend of mine who's working daily on AWS at (_very big_) scale, he rises the argument of how mature those declarative DSL approaches are today compared to other battle tested _old_ technologies like Python. He's right when he says there has been not enough time yet to squash all the most annoying bugs, reduce the workarounds needed in some common scenarios like multi-region/multi-account setups and to consolidate best practices.

Honestly it's a hard call and I don't feel like I have enough hands-on experience yet with CDK and the other tools to make it.

## General reception

Apparently CDK approach is not very welcome in the _Serverless_ world. For example in the latest ["Serverless Chats" podcast][podcast] episode (around minute 34') CDK doesn't get much appreciation compared to other tools like _Serverless Framework_ or _SAM_.

I understand the argument validity, that those tools might be a better fit compared to CDK in specific _serverless scenarios_, like the ones involving mostly Lambdas and API Gateways. So far though I still believe CDK might fit decently even in those cases. If I got it right from the start, _sane defaults_ and _built in secure IAM setup_ are the biggest key selling points of CDK, not the wide choice of languages available.

On top of that, being an AWS _general purpose_ framework means that you might use it in any kind of projects involving AWS and not only when following a strict _serverless_ approach.

Talking about the possibility for abstractions, they are definitely a selling point too and I agree they are a double edged sword that can get out of hand if used improperly. That said, CDK is not very opinionated on that, leaving you the **freedom to choose** if and when to make use of abstractions, as well as to proceed in a more _procedural_ way if preferred. You can still _choose your poison_.

My recommendation, in this case as in many others, is to try it out and decide by yourself if CDK gives you better results compared to other approaches. On one thing I believe we all agree though: **don't reinvent the wheel** trying to write your own IaC deployment system, just choose the one between the popular ones that better fits to your context.

## Feature requests for CDK devs

I guess these will never make it to the top of their roadmap but it's honestly what I'd like to have changed with the CLI tool at this phase: being able to bootstrap a new project with an empty template (i.e. no automatic scaffolding) with decentralized handling of CDK local metadata (`cdk.out` folder).

This would fit well with my usual workflow that goes similar to this:

1. initialize the project repository
1. add commands to `Makefile` as I go
1. iterate until the project is up and running
1. in the future, when I'll have most probably forgotten the implementation details, just run `git clone && make all` to have the project up and running on a different workstation or CI/CD setup, or deployed on a different target AWS account/region.

Currently the last CDK CLI stable version (1.22.0) only provides an option (`--output`) to place `cdk.out` folder in a different _PATH_ which might help when in a CI/CD but it doesn't when working in a team for example.

Coupled with the feature above it would be nice to have some kind of `cdk sync` command that reads `cdk.out` URI from a local config file and fetches whatever needed (locally) to be able to apply new functionalities (remotely).

Lastly, a nice to have: some kind of `--force` switch for `cdk destroy` to remove every resource created, including the CloudFormation CDK _meta_ stack and CloudWatch Logs (if any).

## Final words

I hope this article and [the mini tutorial][tutorial] give you a good introduction to CDK, the external links above should also point you in the right direction if willing to try CDK out or know more about it.

It's definitely a powerful tool that has just entered the landscape joining other projects that are at a more mature phase of development.

My recommendation is to spare some time and have some fun with it so to make a better informed decision next time you bootstrap a project backed by AWS.

I'm curious to know what you think about it! If you have anything to say or errors and imprecisions to correct please leave a message here or [contact me directly](/contact).

[stack-overflow-link]: <https://stackoverflow.com/a/60015276/2274124>
[supported-regions]:   <https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/>
[stack-py]:            <https://github.com/shaftoe/api-gateway-lambda-cdk-example/blob/master/src/stack.py>
[reusability]:         <https://docs.aws.amazon.com/cdk/latest/guide/cfn_layer.html>
[puppet]:              <https://puppet.com>
[blog-post]:           <https://a.l3x.in/2020/01/29/my-quest-for-identity-in-software-engineering.html>
[tutorial]:            <https://github.com/shaftoe/api-gateway-lambda-cdk-example/>
[leftovers]:           <https://docs.aws.amazon.com/cdk/latest/guide/troubleshooting.html#troubleshooting_nobucket>
[announcement]:        <https://aws.amazon.com/blogs/aws/aws-cloud-development-kit-cdk-typescript-and-python-are-now-generally-available/>
[homepage]:            <https://aws.amazon.com/cdk/>
[podcast]:             <https://www.serverlesschats.com/33>
