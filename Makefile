include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf
BUILD_ENV := development
HOOK_FILE := .git/hooks/pre-commit

server:
	@hugo server

babel-install:
	@npm install -g babel-cli

build:
	@hugo --cleanDestinationDir --minify --environment $(BUILD_ENV)

clean:
	@rm -rf public/

deploy: prebuild build show test

eslint:
	@eslint assets/js/ lib/

fontawesome.css:
	@cp node_modules/@fortawesome/fontawesome-free/css/all.css assets/css/fontawesome.css
	@mkdir -p static/webfonts
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

pip-install:
	@pip install -r requirements.txt

prebuild: clean mastodon mixcloud normalize.css fontawesome.css

setup: npm-install babel-install pip-install

setup-githook:
	@echo "#/bin/bash" > $(HOOK_FILE)
	@echo "make build test clean" >> $(HOOK_FILE)
	@chmod +x $(HOOK_FILE)

stylelint:
	@npx stylelint assets/scss/* public/css/*

show:
	@tree public/

test: eslint stylelint html5validator

upgrade: upgrade-node-modules npm-install

upgrade-node-modules:
	@ncu -u

.PHONY: server build clean deploy eslint fontawesome.css html5validator mastodon mixcloud normalize.css npm-install prebuild setup stylelint test upgrade upgrade-node-modules
