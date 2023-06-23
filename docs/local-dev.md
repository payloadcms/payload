# Developing with this plugin locally

This repository includes a local development environment for local testing and development of this plugin. To run the local sandbox, follow the instructions below.

1. Make sure you have Node and a MongoDB to work with
1. Clone the repo
1. `yarn` in both the root folder of the repo, and the `./dev` folder
1. `cd` into `./dev` and run `cp .env.example .env` to create an `.env` file
1. Open your newly created `./dev/.env` file and _completely_ fill out each property

## Azure Adapter Development

This repository comes with a Docker emulator for Azure Blob Storage.

If you would like to test locally with an emulated blob storage container, you can `cd` into `./src/adapters/azure/emulator` and then run `docker-compose up -d`.

The default `./dev/.env.example` file comes pre-loaded with correct `env` variables that correspond to the Azure Docker emulator.

Otherwise, if you are not using the emulator, make sure your environment variables within `./dev/.env` are configured for your Azure connection.

Finally, to start the Payload dev server with the Azure adapter, run `yarn dev:azure` and then open `http://localhost:3000/admin` in your browser.

## S3 Adapter Development

This repository also includes a Docker LocalStack emulator for S3. It requires a few more steps to get up and running.

To use the S3 emulator, use the following steps:

1. Make sure you have `awscli` installed. On Mac, run `brew install awscli` to get started.
1. Make sure you have an AWS profile created. LocalStack does not verify credentials, so you can create a profile with dummy credentials. However, your `region` will need to match. To create a dummy profile for LocalStack, type `aws configure --profile localstack`. Use the access key and secret from the `./dev/.env.example` and use region `us-east-1`.
1. Now you can start the Docker container via moving to the `./src/adapters/s3/emulator` folder and running `docker-compose up -d`.
1. Once the Docker container is running, you can create a new bucket with the following command: `aws --endpoint-url=http://localhost:4566 s3 mb s3://payload-bucket`. Note that our bucket is called `payload-bucket`.
1. Finally, attach an ACL to the bucket so it is readable: `aws --endpoint-url=http://localhost:4566 s3api put-bucket-acl --bucket payload-bucket --acl public-read`

Finally, you can run `yarn dev:s3` and then open `http://localhost:3000/admin` in your browser.

## Google Cloud Storage (GCS) Adapter Development

This repository comes with a Docker emulator for Google Cloud Storage.

If you would like to test locally with an emulated GCS container, you can `cd` into `./src/adapters/gcs/emulator` and then run `docker-compose up -d`.

The default `./dev/.env.example` file comes pre-loaded with correct `env` variables that correspond to the GCS Docker emulator.

Otherwise, if you are not using the emulator, make sure your environment variables within `./dev/.env` are configured for your Google connection.

Finally, to start the Payload dev server with the GCS adapter, run `yarn dev:gcs` and then open `http://localhost:3000/admin` in your browser.
