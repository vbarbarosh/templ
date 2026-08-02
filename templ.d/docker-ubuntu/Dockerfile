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

# Remote ADD contents participate in Docker's cache key, so a new npm `latest`
# version invalidates the Claude layer without rebuilding the browser layers.
ADD --chown=ubuntu:ubuntu https://registry.npmjs.org/@anthropic-ai%2Fclaude-code/latest /tmp/claude-package.json

RUN CLAUDE_VERSION="$(jq -r .version /tmp/claude-package.json)" \
    && echo "Installing Claude ${CLAUDE_VERSION}..." \
    && curl -fsSL https://claude.ai/install.sh | bash -s "${CLAUDE_VERSION}" \
    && "$HOME/.local/bin/claude" --version \
    && rm /tmp/claude-package.json

# Remote ADD contents participate in Docker's cache key, so a new npm `latest`
# version invalidates the Codex layer without rebuilding the browser layers.
ADD --chown=ubuntu:ubuntu https://registry.npmjs.org/@openai%2Fcodex/latest /tmp/codex-package.json

RUN CODEX_VERSION="$(jq -r .version /tmp/codex-package.json)" \
    && echo "Installing Codex ${CODEX_VERSION}..." \
    && npm install --global "@openai/codex@${CODEX_VERSION}" \
    && codex --version \
    && rm /tmp/codex-package.json \
    && mkdir -p "$HOME/.codex"

USER root

# A PHP application can then run entirely inside this container, with no access
# to anything on the host.
RUN echo Installing PHP and extensions... \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        php-cli \
        php-bcmath \
        php-curl \
        php-gd \
        php-gmp \
        php-intl \
        php-mbstring \
        php-mongodb \
        php-mysql \
        php-redis \
        php-soap \
        php-xml \
        php-zip \
    && php --version \
    && php -m \
    && rm -rf /var/lib/apt/lists/*

RUN echo Installing Composer... \
    && curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php \
    && php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm /tmp/composer-setup.php \
    && composer --version

# Ubuntu 24.04 ships MySQL 8.0. Staying with the distribution package avoids
# adding a third-party apt repository.
RUN echo Installing MySQL and Redis... \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        mysql-server \
        mysql-client \
        redis-server \
    && rm -rf /var/lib/apt/lists/*

RUN echo Installing MinIO... \
    && curl -fsSL https://dl.min.io/server/minio/release/linux-amd64/minio -o /usr/local/bin/minio \
    && curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc \
    && chmod 0755 /usr/local/bin/minio /usr/local/bin/mc \
    && minio --version \
    && mc --version

# Starts all three as the container user, listening on 127.0.0.1 only
COPY files/bin/services /usr/local/bin/services
RUN chmod 0755 /usr/local/bin/services

USER ubuntu

RUN echo Configuring bash... \
    && echo >> $HOME/.bashrc \
    && echo >> $HOME/.bashrc 'alias codex="codex -a never -s danger-full-access"' \
    && echo >> $HOME/.bashrc 'export PATH="$HOME/.local/bin:$PATH"'

WORKDIR /app
