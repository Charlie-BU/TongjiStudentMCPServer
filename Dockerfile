FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install --global pnpm@9.15.9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig*.json ./
COPY src ./src
COPY test ./test
COPY sql ./sql
COPY scripts ./scripts
COPY seed/ ./seed/
# Tests use mock upstreams and temporary databases; no deployment secrets here.
RUN pnpm check
RUN pnpm prune --prod

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3100
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
COPY sql ./sql
COPY seed/ ./seed/
# Keep the full seed outside the mounted runtime volume; never copy a local runtime DB.
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 3100
HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health',{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
