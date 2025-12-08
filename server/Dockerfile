# Use a minimal Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install && \
    chmod -R +x node_modules/.bin

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Command to run the application (using nodemon for dev auto-restarts)
CMD ["npm", "run", "dev"]