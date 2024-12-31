# Using MinIO Server for Local Development

This repository demonstrates how to set up and use MinIO Server for local development in a Node.js application.

## Overview

MinIO is a high-performance, S3-compatible object storage system. This project showcases its seamless integration into development workflows, making it an excellent alternative to AWS S3 for testing and local development.

- **Detailed Article**: [MinIO Server for Local Development on Dev.to](https://dev.to/thenelson_o/advanced-csrf-protection-with-rsa-1loi)

Explore this repository to:

- Learn how to configure MinIO for your Node.js projects.
- Understand how to manage file uploads locally without relying on AWS during development.

## Setup

Follow these steps to get started:

```
yarn
yarn dc:up
yarn dev
```

Ensure you have Docker installed for running the MinIO server using the provided `docker-compose.yml` configuration.
