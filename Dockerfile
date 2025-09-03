# Use official Node.js image as the base
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies based on lock file if available
COPY package.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build:prod

# Production image, copy built assets and use 'serve'
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./

# Install 'serve' to serve the static files
RUN npm install -g serve

# Expose port 5173
EXPOSE 5173
ENV PORT=5173

# Start the app
CMD ["serve", "-s", "dist", "-l", "5173"]
