FROM alpine:3.19.1

# install libs to process and push xml to newrelic
RUN apk add --no-cache --update xmlstarlet curl bash sudo

# install newrelic cli
RUN curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
