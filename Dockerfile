# syntax=docker/dockerfile:1

##
## Stage 1: production dependencies only.
## Kept separate so the Docker cache is only invalidated when package*.json changes.
##
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

##
## Stage 2: final runtime image
##
FROM node:22-alpine AS runtime

# Injected by the CI pipeline: tells a "dev" image (push on main) apart from a
# "prod" image (git tag), and records the commit it was built from.
ARG APP_ENV=development
ARG APP_VERSION=dev
ARG GIT_SHA=unknown

ENV NODE_ENV=production \
    APP_ENV=${APP_ENV} \
    APP_VERSION=${APP_VERSION} \
    GIT_SHA=${GIT_SHA} \
    PORT=3000

# OCI labels: GHCR reads them to link the image to the repository and show its metadata.
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

# node:alpine already ships an unprivileged "node" user.
# Running as non-root is required by most Pod Security Standards.
USER node

EXPOSE 3000

# Container-level probe, useful locally and for `docker ps`.
# Kubernetes uses its own probes declared in the Deployment.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
