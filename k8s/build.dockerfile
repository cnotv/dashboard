# Use an existing base image for the app
FROM node:16

# Set the working directory
RUN mkdir /src
WORKDIR /src

# Copy the package.json and yarn.lock file to the container
COPY package.json /src/
COPY yarn.lock /src/

# Install the dependencies
RUN yarn install

# Copy the rest of the application files
COPY . /src

# Build the app
RUN DEV_PORTS=true TEST_INSTRUMENT=true yarn build

# Expose the default port for the app
EXPOSE 80

# Define the command to run when the container starts
ENTRYPOINT ["yarn"]
CMD ["start"]