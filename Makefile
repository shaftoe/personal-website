include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf

server:
	@hugo server

build: clean mastodon mixcloud normalize.css fontawesome.css
	@hugo

clean:
	@rm -r public/

fontawesome.css:
	@cp node_modules/@fortawesome/fontawesome-free/css/all.css assets/css/fontawesome.css
	@rsync -a --delete node_modules/@fortawesome/fontawesome-free/webfonts/ static/webfonts/

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
	@html5validator --root public/ --also-check-css

upgrade:
	@ncu -u
	@npm install

.PHONY: server build clean fontawesome.css mastodon mixcloud normalize.css setup test upgrade
