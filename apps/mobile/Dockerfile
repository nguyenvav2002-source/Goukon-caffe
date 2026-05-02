FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expo Metro bundler + dev server ports
EXPOSE 8081 19000 19001

# Start Expo in LAN mode so devices on the same network can connect via QR code
CMD ["node_modules/.bin/expo", "start", "--host", "lan", "--port", "8081"]
