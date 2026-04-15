# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[unreleased]: https://github.com/shaftoe/personal-website/compare/v1.16.1...HEAD
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
