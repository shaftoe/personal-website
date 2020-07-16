---
title: Centralise GNU/Linux email delivery like it's 2020
description: The technological side of Email has always occupied a bittersweet corner in my nerdy heart. In this article I dive a bit in the history of SMTP and share a simple but effective solution that I currently use to rationalise system and users' email delivery for a few of the Linux systems I manage.
tags:
  - ansible
  - devops
  - email
  - linux
  - postfix
date: "2020-05-14"
---

> It's quicker, easier, and involves less licking
>
> ― Douglas Adams

For a change today I won't talk about *AWS* nor *serverless* or *event-driven architectures*. Today it's all about *Linux server administration*, the **good ol' email** and its evergreen (even if outdated and patched in all the thinkable ways) `SMTP` protocol.

I understand not everyone has migrated all business logics to a bunch of **Function as a Service** (*FaaS*) and/or cloud-managed **orchestrated containers** yet ([my bet here][blog-0] is that all of us eventually will 😈) and still has to deal with [*old style* server administration][xkcd-uptime] daily. This doesn't mean sysadmin tasks have to be done like it was still 1980.

## I read your emails

Even if I'm a *serverless* fanboy since the early days I occasionally have to wear the *sysadmin hat* (or *system engineer* hat, which is basically the same but way fancier) myself.

In a [previous article][blog-1] for example I showed how to deploy a *Node.js* application on a *Raspberry Pi*, which is an actual Linux server connected to the Internet that needs to be administered like any other, *at least* for keeping its packages up to date applying the latest security patches soon after they are available.

And yes, by default Linux still like to talk to humans via email:

![Screenshot of an email from my Raspberry Pi]({{ "/img/rasp-email-screenshot.png" }}){: .img-fluid }

Here above you can see how my dear *Raspberry Pi* is telling me it needs my collaboration to upgrade one of its packages ASAP. Follow me a little longer if you want to know how exactly I set it up to deliver *cron daemon* emails (actually every internal email sent via the `sendmail` and `SMTP` interfaces) to my personal mailbox, and with every email address present in the headers rewritten to be a valid one too.

The one I'm going to show you is such a *simple solution* to implement that in my opinion it doesn't make sense not to deploy it any time you don't have a need for a more robust setup but you still want to receive those emails (some of which probably containing [precious troubleshooting information][xkcd-incident]), which is probably every system that you own with a *cron [daemon][daemon-purge]* running.

## Email is dead. Long live Email

I keep a special spot for email in my nerdy heart. [The one for `SMTP`][smtp-rfc] is probably the very first `RFC` I've ever read in my (at that time very early) career, the one I've been tinkering the most since (and still far from having mastered it) and probably the one which gave me indirectly the [first monetary income][my-cv] as a sysadmin.

Probably it was during one of those focused moments between typing `MAIL FROM` and `RCPT TO` in a *telnet* session to *port TCP/25* that I fell in love with this profession and I still keep those geeky memories dear.

Email is also one of the early technological children of the Internet and has had a very curious history indeed. Since it was born every now and then there's been `$COMPANY` announcing an exciting new messaging product that will suppress all other competitors, including email, once and for all.

And yeah, if you're in your thirties or above I know you're thinking about [Google Wave][google-wave] right now, any attempt to hide that is futile 😈

No matter how many the death threats though, every time **email refused to die** and even to lose any bit of relevancy, actually going against all the odds and becoming in time more and more popular. I'm willing to bet it has never had any more active users as of today and it's safe to assume, for better or worse, it will remain one of the most popular communication medias for many days to come.

## Uptime: ensure => 99.9999999%

Soon after the widespread adoption of server virtualisation made previous hosting/housing practices obsolete, and especially after AWS changed the computing landscape for good with its `Ec2` APIs (announced the [25th of August 2006][wiki-aws-timeline]!), we've been told the *DevOps mantra* again and again: treat your servers like **cattle** and not like **pets** or, even worse, like **snowflakes**.

A funny *side note*: when the [*pets vs cattle* metaphor][pets-cattle] was forged, **Bob the mail server** was used as *pet* example:

> In the old way of doing things, we treat our servers like pets, for example Bob the mail server. If Bob goes down, it’s all hands on deck. The CEO can’t get his email and it’s the end of the world. In the new way, servers are numbered, like cattle in a herd. For example, www001 to www100. When one server goes down, it’s taken out back, shot, and replaced on the line.

Enough of diversions, back to (maximising) business (value): *Configuration Management* software like **Puppet** and **Ansible** and *Infrastructure as Code* ones like **Terraform** and **CloudFormation** are the de-facto system administrator's tools of modern times: without them it's almost impossible to build **scalable, repeatable, secure and maintainable** infrastructures, just to name a few of the key benefits enforced by those relatively new DevOps practices.

Today is 2020 and I think we can all agree that if you're not managing systems and infrastructures **as code**, it doesn't matter what's the scale of your IT operations, you're doing it wrong. Let's make use of what we're given and tame those wild cattle beasts like pros.

## SMTP is NOT simple

Despite its reassuring name (**Simple** Mail Transfer Protocol) it is anything but simple.

**Postfix** for example, one of the most popular MTA (Mail Transfer Agent) implementation, is a very powerful but complex (albeit elegantly designed) piece of software and I bet its intricacies scare away many potential users (sometimes still scares me too even after all those years, no need to be shy about it).

To be fair most of its complexity comes directly from the `SMTP` specification itself, which was designed during an era when there were no (at least widespread) concepts of *spam* nor *malware* and every netizen was naturally and religiously following the... *netiquette*.

Email creators needed something to enable fast intercommunication for the newly born and very promising computer network during those ancestral times when there was no need for DNS because, well, **all the Internet** *IP address-hostname* mapping was shared via a file called `/etc/hosts` (a file that still today every Linux sysadmin has to know about). They definitely would have never guessed how popular their baby would have become in the years to come.

The end result is that email is basically unsafe and brittle (should we just say *broken*?) by design; in time [new extensions][rcf-ext-1] to the first RFC [followed][rcf-ext-2] trying to overcome the initial design shortcomings, and with every new patch there was some not-zero increase in complexity.

So, to recap, email is a [technical mess][atlantic-article], an [information security disaster][schneier-article] (and probably the most leveraged vector for cyber crime ever)... but as we already said, people still love it dearly (including yours truly) so *as software engineers* at some point in our career we most probably have to deal with it in a way or another, like it or not.

## Show me some config

Thankfully it's not all that grim. The bright side is that, even though just the mere count of [Postfix configuration parameters][postfix-parameters] is frightening, for common use cases like the one I'm presenting right now, there's no need for much of configuration.

Here a redacted copy of my current Raspberry Pi Postfix' main configuration file (`/etc/postfix/main.cf`):

```lang=postfix
compatibility_level = 2
header_checks = regexp:/etc/postfix/reply_to_header
inet_interfaces = loopback-only
masquerade_domains = l3x.in
mydestination =
myhostname = pi.l3x.in
mynetworks = 127.0.0.0/8 [::1]/128
myorigin = l3x.in
relayhost = <my_relay_service>
smtp_sasl_auth_enable = yes
smtp_sasl_security_options = noanonymous
smtp_sasl_password_maps = hash:/etc/postfix/sasl/passwd
smtp_sender_dependent_authentication = yes
smtp_use_tls = yes
recipient_canonical_maps = static:<my_personal_email>
sender_canonical_maps = static:pi
```

If you don't need/want to authenticate to your SMTP relay host you can cut roughly 40% out of it (everything starting with `smtp_`).

The actual Postfix configuration files content is generated from templates by [this Ansible role][github-ansible-role] that I put on GitHub to help me write this article. It works on Debian based system but should provide a good starting point for other Linux distributions and *Unixes* alike (FreeBSD and friends, macOS, etc).

The Ansible role takes care of injecting contextual strings like *domain*, *hostname* and my email address in the right places and also to generate the relayhost password `.db` file from its source (`/etc/postfix/sasl/passwd`). I've put [more details in the GitHub project][github-ansible-role] as reference so you can have a look there if you want to dig more into it.

## Benefits

With this setup come a few handy benefits:

- having this role applied by default to every server means I'm receiving every system email unless otherwise specified
- the `sender_canonical_maps` rewriting let me easily understand which one is the server actually generating the email
- no more forgotten email leftovers in `/var/mail` or `/var/spool/mail` etc.
- this should work especially well for immutable systems setups or more generally where the `/var` file system is mounted read only

## Pitfalls and Caveats

- with this setup **ANY email** sent through the local MTA agent will be eventually delivered to `default_email`. This is by design and generally what I want anyway. If for whatever reason an application running on the system is supposed to deliver emails to external addresses I'd recommend to make use of services like *AWS SES* or *MailJet*, they offer reasonable free tiers and most importantly a long list of features including insights and analytics, bounces management, help to properly setup DNS records for the delivering domain, and so on
- the address generated by `sender_canonical_maps` rewriting  (i.e. `<server_hostname>@my-hip-domain.com`) should be a valid email address to receive bounced emails and to avoid being marked as spam. Service providers like [Njalla][njalla] or [Forward Email][forwaredemail-site] let you easily setup email forwarding for your custom domain and include support for wildcards addresses too
- last but not least, I fell into this pitfall; when initially trying to setup [MailJet][mailjet] as SMTP relayhost, Postfix was complaining loudly: `postfix/smtp warning: SASL authentication failure: No worthy mechs found`. The fix was [easy to find][postfix-sasl-debian] but this was also a reminded how important it is to properly configure *mechs*

![me configuring my mech][me-and-my-mech]{: .img-fluid }

That's it for today! Now you can go and have some fun with (sometimes *reasonably simple*) SMTP setups... and don't forget your *worthy* iMechs 😎

[atlantic-article]: <https://www.theatlantic.com/technology/archive/2018/05/email-is-dangerous/560780/>
[blog-0]: <https://a.l3x.in/2020/01/29/my-quest-for-identity-in-software-engineering.html>
[blog-1]: <https://a.l3x.in/2020/04/27/fix-router-with-raspberry-node-puppeteer.html>
[daemon-purge]: <https://devrant.com/rants/268608/how-to-purge-daemons>
[forwaredemail-site]: <https://forwardemail.net/>
[github-ansible-role]: <https://github.com/shaftoe/ansible-postfix>
[google-wave]: <https://en.wikipedia.org/wiki/Apache_Wave>
[mailjet]: <https://www.mailjet.com>
[me-and-my-mech]: <https://4.bp.blogspot.com/-Op8c1Oyr0g4/UT5slVXWZXI/AAAAAAAAMHA/UJANbKLo85M/s1600/Super_Mech.jpg>
[my-cv]: <https://cv.l3x.in/work/>
[njalla]: <https://njal.la>
[pets-cattle]: <https://cloudscaling.com/blog/cloud-computing/the-history-of-pets-vs-cattle/>
[postfix-parameters]: <http://www.postfix.org/postconf.5.html>
[postfix-sasl-debian]: <https://wiki.debian.org/PostfixAndSASL>
[rcf-ext-1]: <https://tools.ietf.org/html/rfc2487>
[rcf-ext-2]: <https://tools.ietf.org/html/rfc4954>
[schneier-article]: <https://www.schneier.com/blog/archives/2018/06/e-mail_vulnerab.html>
[smtp-rfc]: <https://tools.ietf.org/html/rfc821>
[wiki-aws-timeline]: <https://en.wikipedia.org/wiki/Timeline_of_Amazon_Web_Services>
[xkcd-incident]: <https://xkcd.com/838/>
[xkcd-uptime]: <https://xkcd.com/705/>
