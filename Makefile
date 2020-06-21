include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf

server:
	@hugo server

build: clean mastodon mixcloud normalize.css
	@hugo

clean:
	@rm -r public/

mastodon:
	@node lib/mastodon-downloader.js

mixcloud:
	@node lib/mixcloud-downloader.js

normalize.css:
	@mkdir -p assets/css/
	@cp node_modules/normalize.css/normalize.css assets/css/

setup:
	@npm install
	@pip install -r requirements.txt

test: build
	@html5validator public/index.html

.PHONY: server build clean mastodon mixcloud normalize.css setup test
