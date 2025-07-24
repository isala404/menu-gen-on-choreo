# Use the official Golang image to create a build artifact.
# This is based on Debian and sets the GOPATH to /go.
FROM golang:1.22-alpine

# Set the Current Working Directory inside the container
WORKDIR /app

# We want to populate the module cache based on the go.mod file.
COPY go.mod .
RUN go mod download

# Copy the source code.
COPY . .

# Build the Go app
RUN go build -o main .

# Expose port 8080 to the outside world
EXPOSE 8080

# Run the executable
CMD ["./main"]
