# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- move /gpg slash page to /keys and add SSH key (#392)

## [1.31.0] - 2026-07-10

### Added

- add microblog RSS feed sourced from atproto PDS (#407)

### Changed

- **deps**: update dependencies (#405)

## [1.30.1] - 2026-07-09

### Fixed

- add Jekyll date permalink redirects for legacy blog URLs (#404)

## [1.30.0] - 2026-07-09

### Added

- add build-time redirects for legacy blog post URLs (#403)

## [1.29.0] - 2026-07-09

### Added

- fetch profile picture from PDS at build time (#398)

## [1.28.0] - 2026-07-08

### Added

- advertise GPG public key via OpenPGP link tag (#395)

## [1.27.0] - 2026-07-08

### Added

- move /gpg slash page to /keys and add SSH key (#393)

## [1.26.0] - 2026-07-08

### Added

- add /gpg slash page (#391)

### Changed

- **deps**: update dependencies (#386)
- **deps**: update dependencies (#387)
- **deps-dev**: update dependencies (#388)
- **deps-dev**: update dependencies (#389)

## [1.25.0] - 2026-07-01

### Added

- **contact**: add Bluesky link to contact page (#385)

### Changed

- **deps**: update dependencies (#382)
- **deps**: update dependencies (#383)

## [1.24.0] - 2026-06-29

### Added

- migrate postroll/til/homepage backend from Mastodon to ATproto (#378)

### Changed

- **deps**: update dependencies (#374)

## [1.23.0] - 2026-06-26

### Added

- add "My Forge" me link to the Code section (#371)

### Changed

- **deps**: update dependencies (#366)
- **deps**: update dependencies (#367)
- **deps**: update dependencies (#368)
- **deps**: update dependencies (#369)

## [1.22.0] - 2026-06-22

### Added

- add JSON-LD structured data (Person, WebSite, BlogPosting) (#364)

### Changed

- **ai**: mention /usage page on the /ai slash page (#357)
- **deps**: update dependencies (#351)
- **deps**: update dependencies (#352)
- **deps**: update dependencies (#353)
- **deps**: update dependencies (#358)
- **deps**: update dependencies (#359)
- **deps**: update dependencies (#360)
- **deps**: update dependencies (#361)
- **deps**: update dependencies (#362)

## [1.21.2] - 2026-06-11

### Changed

- **deps**: update dependencies (#346)
- **deps**: update dependencies (#347)
- **deps**: update dependencies (#348)

### Fixed

- resolve sharp types via tsconfig paths (fixes CI ts(7016) error) (#350)

## [1.21.1] - 2026-06-08

### Changed

- **deps**: update dependencies (#344)
- **deps**: update dependencies (#345)

### Fixed

- **usage**: add support for kind

## [1.21.0] - 2026-06-06

### Added

- add /usage page showing live LLM account usage (#343)

### Changed

- **deps**: update dependencies (#337)
- **deps**: update dependencies (#338)
- **deps**: update dependencies (#339)
- **deps**: update dependencies (#340)
- **deps**: update dependencies (#341)

## [1.20.0] - 2026-05-31

### Added

- implement specification.website recommendations (items 3, 5, 14) (#336)

### Changed

- **deps**: update dependencies (#331)
- **deps**: update dependencies (#332)
- **deps**: update dependencies (#333)
- **deps**: update dependencies (#334)

## [1.19.4] - 2026-05-25

### Changed

- **deps**: bump svelte from 5.55.5 to 5.55.7 (#319)
- **deps**: pin back astro to circumvent regression
- **deps**: update dependencies (#317)
- **deps**: update dependencies (#318)
- **deps**: update dependencies (#320)
- **deps**: update dependencies (#321)
- **deps**: update dependencies (#326)
- **deps**: update dependencies (#327)
- **deps**: update dependencies (#328)

### Fixed

- add workaround to Astro runtime bug

## [1.19.3] - 2026-05-11

### Changed

- **deps**: update dependencies (#306)
- **deps**: update dependencies (#307)
- **deps**: update dependencies (#309)
- **deps**: update dependencies (#310)
- **deps**: update dependencies (#311)
- **deps**: update dependencies (#312)
- **deps**: update dependencies (#313)

### Fixed

- make RON the default expense currency (#315)

## [1.19.2] - 2026-04-24

### Fixed

- allow negative expenses

## [1.19.1] - 2026-04-20

### Changed

- add FilterForm component for /expenses
- **deps**: bump

### Fixed

- ensure 404 page builds correctly

## [1.19.0] - 2026-04-17

### Added

- add /til slash page populated from Mastodon #til posts (#288)

### Changed

- convert robots.txt from static to astro page (#286)

## [1.18.2] - 2026-04-16

### Fixed

- keep slashes links sorted
- use correct header level for blog index

## [1.18.1] - 2026-04-16

### Fixed

- remove fonts.bunny.net dependency

## [1.18.0] - 2026-04-16

### Added

- revamp slashes page

### Fixed

- ensure blog works for dev server too

## [1.17.0] - 2026-04-16

### Added

- add unit tests suite (#284)

### Changed

- remove siteConfig.globalMeta.baseUrl in favor of Astro.url (#281)

## [1.16.1] - 2026-04-15

### Fixed

- wrap long lines in og images

## [1.16.0] - 2026-04-15

### Added

- improve og images generation

### Changed

- **deps**: upgrade

## [1.15.0] - 2026-04-15

### Added

- add social images (OG/Twitter cards) with build-time generation (#279)

### Changed

- cleanup config.ts

## [1.14.0] - 2026-04-15

### Added

- randomize blogroll

## [1.13.0] - 2026-04-15

### Added

- link footer version to changelog anchor (#276)

## [1.12.1] - 2026-04-15

### Fixed

- typo

## [1.12.0] - 2026-04-15

### Added

- replace footer "last updated" with version from package.json

## [1.11.0] - 2026-04-15

### Added

- add /slashes page (#272)

## [1.10.1] - 2026-04-14

### Fixed

- process expenses drafts corretly

## [1.10.0] - 2026-04-14

### Added

- add /ai slash page (#269)

## [1.9.2] - 2026-04-14

### Fixed

- clean up HTML validation errors (#266)

## [1.9.1] - 2026-04-14

### Fixed

- update changelog format to comply with KaC

## [1.9.0] - 2026-04-14

### Added

- simplify release process

### Changed

- update readme

## [1.8.2] 2026-04-13

### Fixed

- better wrap footer elements

## [1.8.1] 2026-04-13

### Fixed

- strip Mastodon span tags from toot content ([#264](https://github.com/shaftoe/personal-website/issues/264))

## [1.8.0] 2026-04-13

### Added

- add /postroll page from Mastodon #postroll toots ([#262](https://github.com/shaftoe/personal-website/issues/262))

### Changed

- reorganize src/components into domain-based folders ([#260](https://github.com/shaftoe/personal-website/issues/260))

## [1.7.0] 2026-04-13

### Added

- add h-entry properties for indieweb compatibility

## [1.6.1] 2026-04-13

### Fixed

- rename rss to follow

## [1.6.0] 2026-04-13

### Added

- add /sitemap netlify redirect ([#256](https://github.com/shaftoe/personal-website/issues/256))

### Changed

- relocate keep-a-changelog config from config/ to src/lib/

## [1.5.0] 2026-04-13

### Added

- add /follow page with RSS feeds

## [1.4.0] 2026-04-13

### Added

- add umami tracking, vendor tracker and setup ci to keep it updated

## [1.3.0] 2026-04-12

### Added

- add draft and new support to /expenses

## [1.2.1] 2026-04-12

### Fixed

- add temporal polyfill to support all browsers

## [1.2.0] 2026-04-12

### Added

- add private /expenses route

## [1.1.2] 2026-04-12

### Fixed

- add missing margins to /colophon
- ensure changelog changes are consistent

## [1.1.0] 2026-04-12

### Added

- add semantic release flow, add pi flow

## [1.0.3] 2026-04-12

### Changed

- add GH repo link to /colophon

## [1.0.2] 2026-04-12

### Added

- add dependabot flow

### Changed

- use markdown for /colophon content

## [1.0.1] 2026-04-12

### Added

- add missing last-updated to footer

## [1.0.0] 2026-04-12

### Changed

- Completely revamped tech and style, replaced Hugo with Astro
- Thanks to <https://github.com/RATIU5/zaggonaut> for the free Astro theme

[unreleased]: https://github.com/shaftoe/personal-website/compare/v1.31.0...HEAD
[1.31.0]: https://github.com/shaftoe/personal-website/compare/v1.30.1...v1.31.0
[1.30.1]: https://github.com/shaftoe/personal-website/compare/v1.30.0...v1.30.1
[1.30.0]: https://github.com/shaftoe/personal-website/compare/v1.29.0...v1.30.0
[1.29.0]: https://github.com/shaftoe/personal-website/compare/v1.28.0...v1.29.0
[1.28.0]: https://github.com/shaftoe/personal-website/compare/v1.27.0...v1.28.0
[1.27.0]: https://github.com/shaftoe/personal-website/compare/v1.26.0...v1.27.0
[1.26.0]: https://github.com/shaftoe/personal-website/compare/v1.25.0...v1.26.0
[1.25.0]: https://github.com/shaftoe/personal-website/compare/v1.24.0...v1.25.0
[1.24.0]: https://github.com/shaftoe/personal-website/compare/v1.23.0...v1.24.0
[1.23.0]: https://github.com/shaftoe/personal-website/compare/v1.22.0...v1.23.0
[1.22.0]: https://github.com/shaftoe/personal-website/compare/v1.21.2...v1.22.0
[1.21.2]: https://github.com/shaftoe/personal-website/compare/v1.21.1...v1.21.2
[1.21.1]: https://github.com/shaftoe/personal-website/compare/v1.21.0...v1.21.1
[1.21.0]: https://github.com/shaftoe/personal-website/compare/v1.20.0...v1.21.0
[1.20.0]: https://github.com/shaftoe/personal-website/compare/v1.19.4...v1.20.0
[1.19.4]: https://github.com/shaftoe/personal-website/compare/v1.19.3...v1.19.4
[1.19.3]: https://github.com/shaftoe/personal-website/compare/v1.19.2...v1.19.3
[1.19.2]: https://github.com/shaftoe/personal-website/compare/v1.19.1...v1.19.2
[1.19.1]: https://github.com/shaftoe/personal-website/compare/v1.19.0...v1.19.1
[1.19.0]: https://github.com/shaftoe/personal-website/compare/v1.18.2...v1.19.0
[1.18.2]: https://github.com/shaftoe/personal-website/compare/v1.18.1...v1.18.2
[1.18.1]: https://github.com/shaftoe/personal-website/compare/v1.18.0...v1.18.1
[1.18.0]: https://github.com/shaftoe/personal-website/compare/v1.17.0...v1.18.0
[1.17.0]: https://github.com/shaftoe/personal-website/compare/v1.16.1...v1.17.0
[1.16.1]: https://github.com/shaftoe/personal-website/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/shaftoe/personal-website/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/shaftoe/personal-website/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/shaftoe/personal-website/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/shaftoe/personal-website/compare/v1.12.1...v1.13.0
[1.12.1]: https://github.com/shaftoe/personal-website/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/shaftoe/personal-website/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/shaftoe/personal-website/compare/v1.10.1...v1.11.0
[1.10.1]: https://github.com/shaftoe/personal-website/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/shaftoe/personal-website/compare/v1.9.2...v1.10.0
[1.9.2]: https://github.com/shaftoe/personal-website/compare/v1.9.1...v1.9.2
[1.9.1]: https://github.com/shaftoe/personal-website/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/shaftoe/personal-website/compare/v1.8.2...v1.9.0
[1.8.2]: https://github.com/shaftoe/personal-website/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/shaftoe/personal-website/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/shaftoe/personal-website/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/shaftoe/personal-website/compare/v1.6.1...v1.7.0
[1.6.1]: https://github.com/shaftoe/personal-website/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/shaftoe/personal-website/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/shaftoe/personal-website/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/shaftoe/personal-website/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/shaftoe/personal-website/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/shaftoe/personal-website/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/shaftoe/personal-website/compare/v1.1.2...v1.2.0
[1.1.2]: https://github.com/shaftoe/personal-website/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/shaftoe/personal-website/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/shaftoe/personal-website/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/shaftoe/personal-website/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/shaftoe/personal-website/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/shaftoe/personal-website/releases/tag/v1.0.0
