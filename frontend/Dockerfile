# Use the official node image as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Build the app
RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Serve the app
CMD ["npm", "run", "dev"]
