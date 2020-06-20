---
title: Integrating Sonos with Spreaker RSS feed
tags:
  - fsm
  - ifttt
  - podcast
  - python
  - rss
  - sonos
date: "2016-02-23"
---

Berlin winter is famous to be quite cold (ok, let's be honest, I'm a tech addict and can't help the urge of hack around from time to time) so recently I've spent some fun time tinkering a bit with this _Internet Of Things_ idea: how to make my flat a little bit more automated and have fun while adding this completely superfluous automation?

## First world problems

One of the things I've been missing from my dear [Sonos][sonos] system is a proper RSS integration with [Spreaker][spreaker]: I love RSS feeds, they are simple and easy to use, and Spreaker is so kind to provide one for every show I like. With [SoCo][soco] library is trivial to write a Python based CLI tool to add an HTTP URL with the mp3 to play, but I'm _notoriously_ lazy, I don't want to open my laptop, fire up the browser, right-click for copying links to the clipboard, and type commands in the terminal unless _strictly needed_; all I want in this case is to be able to open the Sonos app and listen a podcast **just tapping on the fresh new Spreaker episode** when it's available.

## Shopping list

To make this possible, I need quite a few (free or open source) pieces:

* Python >v2.7 with [SoCo][soco] and [Bottle][bottle] libraries
* IFTTT [Maker][maker] and [RSS][rss] channels
* a hosting provider for free GIT repository (i.e. GitHub)
* some config management scripts to make this easy to install (even if I'm a Puppet fan, I took the chance to try out Ansible for this)

plus an always-on host connected to the Internet that runs Python (I use a RaspberryPi for the purpose) in the same LAN of the Sonos system (i.e. my flat).

## How does it work

this is the basic workflow:

* [IFTTT RSS channel][rss] reads from a [Spreaker][spreaker] feed there's a new episode available (and sends on my phone a push notification about this)
* the connected [IFTTT Maker channel][maker] sends an HTTP GET request to the in-house server with the URL of the episode as a parameter
* [this Bottle/SoCo based][my app] HTTP server receives the request, parses it filtering for the mp3 link needed by Sonos to be able to play the episode, and adds that to the Sonos queue

## How to set this up

* get a free IFTTT account if you don't have it yet
* create a recipe that looks like this

![iftt screenshot][ifttt screenshot]

* create a SNAT rule on your router, or do whatever it takes to be able to make an HTTP GET on port TCP/9999 from the outside

  ```Internet  TCP:80 (Internet Router)  TCP:9999 (RaspberryPi)```

* clone [this GIT repo][my app] somewhere on your home host, edit the speakers.txt file with the IP addresses of your Sonos components, and finally:

  ```$ ./pysonos/sonos.py```

That's it. From now on, you should be able to play a new [Spreaker][spreaker] episode as soon as it is available in the RSS feed directly from your Sonos player app.

## Food for blog

I could also make the Ansible code public, or show how I'm messing around my flat with other (location based) IFTTT integrations, but for one blog entry seems already enough, so I'll keep that for future winters.

## Conclusion

Well, in the end as you can see it's not that complex, all the pieces are already out there and I just needed to wrap them up, plug in my almost-forgotten RaspberryPi, and write some glue Python code, that is always great fun.

If you liked this article, please consider <s>a donation</s> dropping unrational beliefs like monotheistic religions, but if you **really** need to believe in a supernatural entity, then at least try out the [Pastafarian cult][fsm] first. Thanks!

[bottle]: <http://bottlepy.org>
[fsm]: <http://www.venganza.org/>
[ifttt screenshot]: <ifttt_screenshot.png>
[maker]: <https://ifttt.com/maker>
[my app]: <https://github.com/shaftoe/pysonos>
[rss]: <https://ifttt.com/feed>
[soco]: <http://python-soco.com>
[sonos]: <http://www.sonos.com>
[spreaker]: <http://www.spreaker.com>
