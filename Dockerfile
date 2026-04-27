# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all application files
# NOTE: This will include your .env file so Vite can bake the VITE_ 
# variables into the static production bundle during the build step.
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Serve the application using a lightweight Node server
FROM node:20-alpine

WORKDIR /app

# Install `serve` globally to serve static files
RUN npm install -g serve

# Copy only the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the requested port
EXPOSE 4173

# Start the server, serving the built assets on port 4173
# The -s flag ensures fallback to index.html for Single Page Applications (client-side routing)
CMD ["serve", "-s", "dist", "-l", "4173"]
