# Use Node.js LTS as base image
FROM node:20-alpine

# Install Expo CLI globally
RUN npm install -g expo-cli @expo/ngrok

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose Expo ports
# 8081 - Metro bundler
# 19000 - Expo dev server
# 19001 - Expo dev server (alternate)
# 19002 - Expo dev server (alternate)
EXPOSE 8081 19000 19001 19002

# Set environment variables for Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=localhost

# Start Expo development server
CMD ["npx", "expo", "start", "--web"]
