# Stage 1: Build the application
FROM node:24-alpine AS builder
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./
#RUN npm install
RUN npm install 

COPY . .

# Set the backend URL during build time
# (Next.js needs this at build time to bake it into the client-side code)
ENV NEXT_PUBLIC_API_URL=https://of.kaayaka.in/api/v1
RUN npm run build

# Stage 2: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Standalone mode doesn't need the full node_modules. 
# It creates a self-contained server.js in the standalone folder.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Use the server.js created by standalone mode
CMD ["node", "server.js"]