FROM node:18

WORKDIR /app

# Install backend dependencies
COPY package*.json ./
RUN npm install

# Copy full project
COPY . .

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install
RUN npm install typescript vite

# Build frontend
RUN chmod +x ./node_modules/.bin/tsc
RUN npm run build

# Switch back to backend
WORKDIR /app
CMD ["node", "index.js"]