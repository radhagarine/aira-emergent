# Use an official Node.js runtime as the base image
FROM node:18-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Install Python and other build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Copy the .env.local file
COPY env.prod .env.local

# Build the Next.js application
RUN npm run build

# Install testing dependencies
RUN npm install -D \
    vitest \
    @vitest/coverage-v8 \
    @faker-js/faker \
    @testing-library/react \
    @supabase/supabase-js

# Expose the port the app runs on
EXPOSE 3000

# Set the environment variable for production
ENV NODE_ENV=production

# Create a volume for test results (optional)
VOLUME ["/app/coverage"]

# Here you can add commands to run your tests
CMD ["npm", "run", "test"]

# Default run stage
FROM base AS run
CMD ["npm", "start"]