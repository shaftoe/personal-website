include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf

server:
	@hugo server

download_mastodon:
	@node lib/mastodon-downloader.js

download_mixcloud:
	@node lib/mixcloud-downloader.js

.PHONY: server
