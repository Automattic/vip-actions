FROM alpine:3.10

# install libs to process and push xml to newrelic
RUN apk update && \
    apk add xmlstarlet curl bash sudo

# install newrelic cli
RUN curl -Ls https://download.newrelic.com/install/newrelic-cli/scripts/install.sh | bash


COPY entrypoint.sh /entrypoint.sh

RUN ["chmod", "+x", "/entrypoint.sh"]

ENTRYPOINT ["/entrypoint.sh"]