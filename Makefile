include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf

server:
	@hugo server

setup:
	@npm install

mastodon:
	@node lib/mastodon-downloader.js

mixcloud:
	@node lib/mixcloud-downloader.js

.PHONY: server setup mastodon mixcloud
