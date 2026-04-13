# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
