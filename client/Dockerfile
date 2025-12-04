# Use a minimal Node.js image for the client
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the Vite development server runs on
EXPOSE 3000

# Command to run the React app (Vite dev server)
CMD ["npm", "run", "dev"]