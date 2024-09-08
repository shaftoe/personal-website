include defaults.mk

export GITHUB_ACCOUNT_ID := shaftoe
export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := bakari-music
export YOUTUBE_CHANNEL := UCb5FGNik4wXGrVGRS1x2JZw
HOOK_FILE := .git/hooks/pre-commit
NODE := node --unhandled-rejections=strict
DOCKER_IMAGE := shaftoe/a-l3x-in
DOCKER_PLATFORM := linux/amd64
HUGO_VERSION := $(shell grep HUGO_VERSION netlify.toml | cut -d '"' -f 2)
NODE_VERSION := 16

server:
	@hugo server --disableFastRender --environment development --buildFuture

axios:
	@mkdir -p assets/js/vendor
	@cp node_modules/axios/dist/axios.min.js assets/js/vendor/

babel-install:
	@npm install -g babel-cli

build:
	@hugo --cleanDestinationDir --minify --buildFuture

clean:
	@rm -rf public/

deploy: prebuild build show

eslint:
	@eslint assets/js/*.js lib/

fontawesome.css:
	@cp node_modules/@fortawesome/fontawesome-free/css/all.css assets/css/fontawesome.css
	@mkdir -p static/webfonts
	@rsync -a --delete node_modules/@fortawesome/fontawesome-free/webfonts/ static/webfonts/

html5validator:
	@html5validator --root public/ --also-check-css

github:
	@$(NODE) lib/github-downloader.js

mastodon:
	@$(NODE) lib/mastodon-downloader.js

mixcloud:
	@$(NODE) lib/mixcloud-downloader.js

normalize.css:
	@mkdir -p assets/css/
	@cp node_modules/normalize.css/normalize.css assets/css/

inject-auth-token:
	sed -i "s|###TOKEN###|$(AUTH_TOKEN)|g" assets/js/common.js

npm-install:
	@npm install

opengraph:
	@$(NODE) lib/opengraph.js

pip-install:
	@pip install -r requirements.txt

prebuild: clean setup axios tracker mastodon mixcloud youtube github normalize.css fontawesome.css opengraph inject-auth-token

setup: npm-install babel-install pip-install

setup-githook:
	@echo "#/bin/bash" > $(HOOK_FILE)
	@echo "make build test clean" >> $(HOOK_FILE)
	@chmod +x $(HOOK_FILE)

stylelint:
	@npx stylelint assets/scss/* public/css/*

show:
	@tree public/

# test: eslint stylelint html5validator
test: eslint

tracker:
	@npm install ackee-tracker
	@cp node_modules/ackee-tracker/dist/ackee-tracker.min.js assets/js/vendor/

upgrade: upgrade-node-modules npm-install

upgrade-node-modules:
	@ncu -u

youtube:
	@$(NODE) lib/youtube-downloader.js

docker-build:
	docker build --rm --build-arg NODE_VERSION=$(NODE_VERSION) --build-arg HUGO_VERSION=$(HUGO_VERSION) --platform $(DOCKER_PLATFORM) -t $(DOCKER_IMAGE) .

docker-run:
	docker run -v $(shell pwd):/website -it --rm --platform $(DOCKER_PLATFORM) $(DOCKER_IMAGE) /bin/bash

.PHONY: server build clean deploy eslint fontawesome.css github html5validator mastodon mixcloud normalize.css npm-install opengraph prebuild setup setup-githook stylelint test upgrade upgrade-node-modules docker-build docker-run inject-auth-token
