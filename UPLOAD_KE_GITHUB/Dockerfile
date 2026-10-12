# ==============================================================================
# RAHUL LIGHT — MA2 FILE DOWNGRADER PRODUCTION DOCKERFILE
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install dependencies (only production)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY server ./server
COPY public ./public

# Expose server port
EXPOSE 3000

# Run as non-root user for security
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start production server
CMD ["node", "server/index.js"]
