FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN echo Installing basic tools... \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        file \
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

ENV NPM_CONFIG_PREFIX="/home/ubuntu/.local"
ENV NODE_PATH="/home/ubuntu/.local/lib/node_modules"
ENV PATH="/home/ubuntu/.local/bin:${PATH}"
ENV PLAYWRIGHT_BROWSERS_PATH="/home/ubuntu/.cache/ms-playwright"
ENV PUPPETEER_CACHE_DIR="/home/ubuntu/.cache/puppeteer"

USER ubuntu

RUN echo Installing Playwright 1.61.1 and Puppeteer 25.3.0... \
    && PUPPETEER_SKIP_DOWNLOAD=true npm install --global \
        playwright@1.61.1 \
        puppeteer@25.3.0 \
    && playwright --version \
    && node -e "console.log('Puppeteer ' + require('puppeteer/package.json').version)"

USER root

RUN echo Installing browser system dependencies... \
    && playwright install-deps \
    && rm -rf /var/lib/apt/lists/*

USER ubuntu

RUN echo Installing Playwright browsers... \
    && playwright install chromium firefox webkit \
    && playwright install --list

RUN echo Installing Puppeteer browsers... \
    && puppeteer browsers install

RUN echo Installing claude... \
    && curl -fsSL https://claude.ai/install.sh | bash

# Remote ADD contents participate in Docker's cache key, so a new npm `latest`
# version invalidates the Codex layer without rebuilding the browser layers.
ADD --chown=ubuntu:ubuntu https://registry.npmjs.org/@openai%2Fcodex/latest /tmp/codex-package.json

RUN CODEX_VERSION="$(jq -r .version /tmp/codex-package.json)" \
    && echo "Installing Codex ${CODEX_VERSION}..." \
    && npm install --global "@openai/codex@${CODEX_VERSION}" \
    && codex --version \
    && rm /tmp/codex-package.json \
    && mkdir -p "$HOME/.codex"

RUN echo Configuring bash... \
    && echo >> $HOME/.bashrc \
    && echo >> $HOME/.bashrc 'alias codex="codex -a never -s danger-full-access"' \
    && echo >> $HOME/.bashrc 'export PATH="$HOME/.local/bin:$PATH"'

WORKDIR /app
