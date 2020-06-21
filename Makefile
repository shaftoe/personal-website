include defaults.mk

server:
	@hugo server

download_mastodon:
	@node lib/mastodon-downloader.js

.PHONY: server
