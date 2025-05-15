FROM ubuntu:24.04

# https://github.com/Yelp/dumb-init
ADD --chmod=755 https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 /usr/bin/dumb-init

RUN echo Installing redir... \
    && apt-get update \
    && apt-get install -y redir

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["bash", "-c", "set -x; redir 172.17.0.1:3306 127.0.0.1:3306; sleep 365d"]
