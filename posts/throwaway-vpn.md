---
title: Cheap and easy throwaway VPN server
tags:
  - protonmail
  - ssh
  - vpn
  - wireguard
timestamp: 2026-09-22
slug: throwaway-vpn
description: I travel a lot and I don't like censored internet, in this article I'm discussing the various workarounds I put in place to circumvent restrictions.
---
In my [previous blog post](/blog/my-travel-setup) I mention I use to travel far and frequently and describe the gear I take with me to make it a more pleasant experience. Unfortunately not every place I visit offers the same kind and levels of freedoms I got used to growing up in a liberal democracy 🇪🇺.

To be completely honest, that by itself doesn't usually limit my perceived freedoms much[^1], unrestricted internet access though might not always be possible without some kind of workaround and in this article I'm going to show you the ones I usually put in place to circumvent such restrictions.

## Simple workaround - DNS resolvers

By default I ignore the DNS resolvers offered by e.g. `DHCP` and use one of the freely available wildly known, usually [Cloudflare's](https://developers.cloudflare.com/1.1.1.1/ip-addresses/). Setting one up in my `minirouter`[^2] means that's going to be transparent for every other device connecting to my private LAN. Some provider allows for extra privacy like _DNS over TLS_ and I recommend to turn it on because it generally comes with no perceivable extra latency, so why not?

This simple change by itself doesn't help against filtered IP blocks or ports but it's already useful in avoiding a series of other annoyances and, most importantly, it's a fire-and-forget kind of configuration change that makes it a no brainer.

## Next round - ProtonVPN

For years I've been a happy customer of [Proton services](https://proton.me/) and I can't recommend them enough: they offer a simple and cost effective way to get rid of annoying ads-infested Google services while getting a big boost in privacy, there's a free plan too so you can start for free and pay for the pro services only once you feel the need, like I did.

I'm now a _Mail Plus_ subscriber[^3] and with that I can also make use of their free VPN service[^4]. It kind of works actually, the client is just a `brew install protonvpn` away and it's simple to use.

One problem I have with this is that it won't let me choose the country on the exit side of the VPN. That's reasonable for a free service but it might not help in solving the blocking/filtering problem if the exit country is also applying filters. More in general the quality of service might be degraded because of overloaded servers, so all in all is mostly hit and miss and I can't rely on that as a stable solution.

There are more reasons why I want to be able to choose where the VPN exit point is located, for example some streaming platform might restrict or show different available content based on the _geographical_ position of the source IP address, and so on.

I hear you: why not to pay for the pro ProtonVPN service too, or any of the many other VPN services out there? I could but it would be mostly a waste of money given that my need for a VPN connection is very spotty and never accounts for more than a few hours per month at worst.

What if I could just boot a _pro VPN server_ on demand, pay only for the hours I use it and even choose in which region of the world it runs?

## Final round - enter EC2

What I do when custom DNS and ProtonVPN aren't helping is simple enough: I just spin up a WireGuard server with a single CLI command, connect my WireGuard clients to it as full tunnel, tear it down once I'm done with another CLI command.

Simple, fast, effective, and _very_ cheap:

```sh
$ cd aws-ec2-vpn
$ just apply

[cut...]

Apply complete! Resources: 4 added, 0 changed, 0 destroyed.

Outputs:

ssh_command = "ssh -D 9999 ec2-user@ec2.vpn.l3x.in"
wireguard_client_config = <<EOT
[Interface]
PrivateKey = <CLIENT PRIVATE KEY>
Address    = 10.100.100.2/32
DNS        = 1.1.1.1

[Peer]
PublicKey  = zCkwbXunuRY8fmZ7Dl8xO5vRx8wgNil770l5GVlEmGc=
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint   = ec2.vpn.l3x.in:51820
PersistentKeepalive = 25

EOT
```

All I need to do is to copy (once) the printed WireGuard configuration into e.g. my Macbook's WireGuard client and enable that to tunnel all the network traffic via the new VPN instance.

To tear it down:

```sh
$ just destroy

[cut...]

Destroy complete! Resources: 4 destroyed.
```

### Under the hood

You can find the implementation in [this repository](https://forge.l3x.in/alex/aws-ec2-vpn/) hosted on [my forge](/blog/welcome-to-my-forge), it should be usable out of the box assuming you have [OpenTofu](https://opentofu.org/)[^5] installed and an AWS account to use.

The module doesn't do much as you can see, I list the gist of it here for the ones who aren't interested in the code:

- creates an EC2 security group for the instance to accept `ssh` and `wireguard` traffic in, allow all egress
- boots an up-to-date `arm64` Amazon Linux 2023 EC2 instance, type `t4g.nano`, currently [the cheapest option](https://cloudprice.net/aws/ec2/instances/t4g.nano) which sells for ~0.0042USD/hour depending on the chosen region
- runs `cloud-init` to upgrade packages, install WireGuard and configure it as server with the given keys, setup `iptables` rules
- optionally adds a DNS record so WireGuard client config can be static

Most of the default configuration values can be changed, refer to [`variables.tf`](https://forge.l3x.in/alex/aws-ec2-vpn/src/branch/master/variables.tf) for more details.

If for whatever reason you don't want to use AWS, it should be relatively easy to (_ask a coding agent to_) modify the module to use your favorite provider instead, like Digital Ocean or else, and spin up the instance there instead.

The module has also a feature switch that lets me create a `CNAME` DNS record into my `l3x.in` zone that I host at [Njalla](https://njal.la/) but  you can consider that as an implementation detail and use a different provider for that too, or simply ignore the extra DNS record and use the public EC2 DNS hostname directly; the repository is meant to be used as a blueprint more than a one-size-fits-all solution.

## Why not XYZ?

I'm sure many other valid solutions, like the ones offered by [Tailscale](https://tailscale.com/), exist. I still prefer to bake my own and avoid creating yet another account / install other software on my workstation when the effort is relatively low.

For Tailscale in particular I find myself in this funny situation by which I admire their offering and at the same time I never feel like I need them because I can simply get away with just some WireGuard and `iptables`.

Most notably... where's the fun going to be otherwise?

## Conclusion

I hope you have found this helpful, as usual I'm looking forward to get your feedback, see [`/contact`](/contact) to get in touch with me.

Disclaimer: I don't make use of any LLM help for writing my blog posts and this one is no exception.

Keep on rockin' in the Free ~~World~~ Internet 🤘

[^1]: applying for visas is still a pain though, especially here in South East Asia where I'm living right now

[^2]: see [previous article](/blog/my-travel-setup/) about my travel setup

[^3]: I currently pay them US$83.76 for 24 months, so ~3.5USD/month

[^4]: perhaps it works for freemium subscribers too, can't say for sure now

[^5]: or Terraform... but you should really use OpenTofu
