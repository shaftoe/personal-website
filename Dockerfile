FROM debian:latest

ARG HUGO_VERSION
ARG NODE_VERSION
ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y wget make bash-completion python3-pip \
  && apt-get dist-upgrade -y \
  && wget -O nodesource_setup.sh https://deb.nodesource.com/setup_${NODE_VERSION}.x \
  && chmod +x nodesource_setup.sh \
  && ./nodesource_setup.sh \
  && rm nodesource_setup.sh \
  && apt-get install -y nodejs \
  && npm install -g npm eslint \
  && wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.deb \
  && dpkg -i hugo_extended_${HUGO_VERSION}_Linux-64bit.deb \
  && rm hugo_extended_${HUGO_VERSION}_Linux-64bit.deb \
  && apt-get clean \
  && pip install --upgrade pip \
  && pip install html5validator

WORKDIR /website
