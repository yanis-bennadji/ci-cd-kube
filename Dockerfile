# syntax=docker/dockerfile:1


FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force


FROM node:22-alpine AS runtime


RUN apk update && apk upgrade --no-cache


RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack


ARG APP_ENV=development
ARG APP_VERSION=dev
ARG GIT_SHA=unknown

ENV NODE_ENV=production \
    APP_ENV=${APP_ENV} \
    APP_VERSION=${APP_VERSION} \
    GIT_SHA=${GIT_SHA} \
    PORT=3000

LABEL org.opencontainers.image.title="ci-cd-kube" \
      org.opencontainers.image.description="Demo application for the CI/CD + Kubernetes project" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.source="https://github.com/yanis-bennadji/ci-cd-kube" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
