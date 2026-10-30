# ──────────────────────────────────────────────────────────────────────────────
# StudyHub Frontend — Multi-stage Production Dockerfile
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build Client Assets ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies with lockfile support
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build production bundle with Vite
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Production Nginx Server ──────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy built static assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check verifies Nginx is serving index.html
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
