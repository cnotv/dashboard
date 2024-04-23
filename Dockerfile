FROM node:14-alpine

RUN mkdir /src
WORKDIR /src

RUN apk update && apk upgrade

COPY . /src

RUN yarn --pure-lockfile install

ENV ROUTER_BASE="/"
ENV RESOURCE_BASE="http://rancher-deployments.cnotv.xyz/rancher-deployment/"
RUN yarn build

EXPOSE 80
ENTRYPOINT ["yarn"]
CMD ["start:prod"]
