FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Expose port 5000
EXPOSE 5000

# Start the Node.js server
CMD ["node", "server.js"]
