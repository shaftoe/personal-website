include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf

server:
	@hugo server

prebuild: clean mastodon mixcloud normalize.css fontawesome.css

build:
	@hugo --cleanDestinationDir --minify

clean:
	@rm -rf public/

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

stylelint:
	@npx stylelint assets/scss/*.scss

test: eslint stylelint html5validator

upgrade: upgrade-node-modules npm

upgrade-node-modules:
	@ncu -u

.PHONY: server build clean eslint fontawesome.css html5validator mastodon mixcloud normalize.css npm-install setup stylelint test upgrade upgrade-node-modules
