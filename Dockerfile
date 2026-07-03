# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-timeout=300000

FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_DEMO_MODE=false
ARG VITE_AUTH_MODE=postgres
ENV VITE_DEMO_MODE=${VITE_DEMO_MODE}
ENV VITE_AUTH_MODE=${VITE_AUTH_MODE}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV VITE_DEMO_MODE=false
ENV VITE_AUTH_MODE=postgres
ENV AUTH_MODE=postgres
ENV DATA_STORE=postgres

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=build /app/scripts ./scripts

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:3000').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.cjs"]
