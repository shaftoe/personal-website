---
layout: ../layouts/ProseLayout.astro
title: GPG
description: My GPG public key for verifying signed messages and sending encrypted email.
keywords: ["gpg", "pgp", "public key", "encryption", "identity"]
subtitle: "Verify my identity."
---

If you need to confirm something really came from me, encrypt a message meant for my eyes only, or otherwise prove you're talking to the right person, my GnuPG public key is published at <a href="https://gpg.l3x.in/" rel="me">gpg.l3x.in</a>.

Use it to verify signed messages or send me encrypted email:

```text
curl https://gpg.l3x.in/ | gpg --import
```

## References

A few links if you're new to GPG:

- <https://heylyle.com/en/posts/gpg-practice>
- <https://gnupg.org/faq/gnupg-faq.html#general>

## Warning

Always verify the fingerprint through a separate, trusted channel if authenticity is critical. You can [contact me](/contact) to confirm a fingerprint out-of-band.
