include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf

server:
	@hugo server

build: clean mastodon mixcloud normalize.css fontawesome.css
	@hugo --cleanDestinationDir --minify

clean:
	@rm -r public/

eslint:
	@eslint assets/js/ lib/

fontawesome.css:
	@cp node_modules/@fortawesome/fontawesome-free/css/all.css assets/css/fontawesome.css
	@rsync -a --delete node_modules/@fortawesome/fontawesome-free/webfonts/ static/webfonts/

html5validator:
	@html5validator --root public/ --also-check-css

mastodon:
	@node lib/mastodon-downloader.js

mixcloud:
	@node lib/mixcloud-downloader.js

normalize.css:
	@mkdir -p assets/css/
	@cp node_modules/normalize.css/normalize.css assets/css/

npm-install:
	@npm install

setup: npm-install
	@pip install -r requirements.txt


test: build eslint html5validator

upgrade: upgrade-node-modules npm

upgrade-node-modules:
	@ncu -u

.PHONY: server build clean eslint fontawesome.css html5validator mastodon mixcloud normalize.css npm-install setup test upgrade upgrade-node-modules
