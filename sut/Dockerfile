FROM node:22-bookworm-slim
ARG SUT_REPO
ARG SUT_SHA
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN git init . \
 && git remote add origin "$SUT_REPO" \
 && git fetch --depth 1 origin "$SUT_SHA" \
 && git checkout FETCH_HEAD
COPY patches/ /patches/
RUN for p in /patches/*.patch; do [ -e "$p" ] || continue; git apply "$p"; done
RUN npm ci && npm run build -w frontend
WORKDIR /app/backend
ENV NODE_ENV=production PORT=3001
EXPOSE 3001
CMD ["node", "index.js"]
