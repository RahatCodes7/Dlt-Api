FROM node:20-alpine AS builder

WORKDIR /app

# Browser calls stay on this site's origin; Next proxies /v1/* to the API.
ARG API_PROXY_TARGET=https://dltbackend.cc.cd
ENV API_PROXY_TARGET=${API_PROXY_TARGET}
ARG NEXT_PUBLIC_SITE_URL=https://dltapi.cc.cd
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV API_PROXY_TARGET=https://dltbackend.cc.cd

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
