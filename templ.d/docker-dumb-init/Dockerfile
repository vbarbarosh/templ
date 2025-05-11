FROM node:22.15.0

# # https://github.com/Yelp/dumb-init
# RUN echo 'Installing dumb-init...' \
#     && curl -sfS -L https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 -o /usr/bin/dumb-init \
#     && chmod a+x /usr/bin/dumb-init

# https://github.com/Yelp/dumb-init
ADD --chmod=755 https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 /usr/bin/dumb-init

# # https://github.com/Snawoot/opera-proxy
# ADD --chmod=755 https://github.com/Snawoot/opera-proxy/releases/download/v1.2.5/opera-proxy.linux-amd64 /usr/bin/opera-proxy
#
# # https://github.com/Snawoot/hola-proxy
# ADD --chmod=755 https://github.com/Snawoot/hola-proxy/releases/download/v1.11.0/hola-proxy.linux-amd64 /usr/bin/hola-proxy

COPY . /app
WORKDIR /app
RUN npm install

USER node
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npm", "start"]
