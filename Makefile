include defaults.mk

export MASTODON_ACCOUNT_ID := 36187

server:
	@hugo server

download_mastodon:
	@node lib/mastodon-downloader.js

.PHONY: server
