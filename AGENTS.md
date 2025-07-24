This document provides guidance for AI agents working with this monorepo.

## Project Structure

The repository is a monorepo with two main directories:

*   `backend`: Contains the Go backend service.
*   `frontend`: Contains the React frontend application.

## Working with the Backend

*   **Dependencies:** Backend dependencies are managed with Go modules. To add a new dependency, run `go get <package>` from the `backend` directory.
*   **Running the backend:** To run the backend locally, navigate to the `backend` directory and run `go run main.go`.
*   **Building the backend:** To build the backend, navigate to the `backend` directory and run `go build -o main .`.

## Working with the Frontend

*   **Dependencies:** Frontend dependencies are managed with npm. To add a new dependency, run `npm install <package>` from the `frontend` directory.
*   **Running the frontend:** To run the frontend locally, navigate to the `frontend` directory and run `npm run dev`.
*   **Building the frontend:** To build the frontend, navigate to the `frontend` directory and run `npm run build`.

## Docker

The entire application can be run using Docker Compose. The `docker-compose.yml` file in the root of the repository orchestrates the `backend` and `frontend` services.

To start the application, run `docker-compose up -d` from the root of the repository.
