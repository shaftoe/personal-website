include defaults.mk

export MASTODON_ACCOUNT_ID := 36187
export MIXCLOUD_ACCOUNT_ID := al3xf
export DEFAULT_MODULE_PATH := ./node_modules
export MODULE_PATH := $(shell MPATH=$${NODE_MODULES_PATH:-$(DEFAULT_MODULE_PATH)}; echo $$MPATH)

server:
	@hugo server

babel-install:
	@npm install -g babel-cli

build:
	@hugo --cleanDestinationDir --minify

clean:
	@rm -rf public/

# deploy: prebuild build postbuild test FIXME
# deploy: prebuild build postbuild
deploy:
	which babel
	find / -type d -iname '*fontawesome*'

eslint:
	@eslint assets/js/ lib/

fontawesome.css:
	@cp node_modules/@fortawesome/fontawesome-free/css/all.css assets/css/fontawesome.css

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

postbuild:
	@mkdir -p static/webfonts
	@rsync -a --delete $(MODULE_PATH)/@fortawesome/fontawesome-free/webfonts/ static/webfonts/

prebuild: clean mastodon mixcloud normalize.css fontawesome.css

setup: npm-install babel-install pip-install

stylelint:
	@npx stylelint assets/scss/*.scss

test: eslint stylelint html5validator

upgrade: upgrade-node-modules npm

upgrade-node-modules:
	@ncu -u

.PHONY: server build clean deploy eslint fontawesome.css html5validator mastodon mixcloud normalize.css npm-install prebuild setup stylelint test upgrade upgrade-node-modules
