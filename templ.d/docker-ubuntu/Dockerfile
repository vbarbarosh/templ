FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN echo Installing basic tools... \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        zip unzip \
        wget curl vim \
        htop \
        man \
        g++ \
        make \
        jq \
        ethtool \
        net-tools \
        pciutils \
        parallel \
        pv \
        ripgrep \
        silversearcher-ag \
        tree \
        git \
        yt-dlp \
        ffmpeg \
        imagemagick \
    && rm -rf /var/lib/apt/lists/*

RUN echo Installing Node.js 24.14.1 \
    && curl -fsSL "https://nodejs.org/dist/v24.14.1/node-v24.14.1-linux-x64.tar.xz" -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && node --version \
    && npm --version

RUN echo Installing playwright... \
    && npx playwright install-deps

ENV PATH="/home/ubuntu/.local/bin:${PATH}"
USER ubuntu

RUN echo Installing playwright... \
    && npx playwright install

RUN echo 0

RUN echo Installing claude... \
    && curl -fsSL https://claude.ai/install.sh | bash

RUN echo Installing codex... \
    && npm i -g @openai/codex \
    && mkdir $HOME/.codex

RUN echo Configuring bash... \
    && echo >> $HOME/.bashrc \
    && echo >> $HOME/.bashrc 'alias codex="codex -a never -s danger-full-access"' \
    && echo >> $HOME/.bashrc 'export PATH="$HOME/.local/bin:$PATH"'

WORKDIR /app
