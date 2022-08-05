# Payload Cloud Storage Plugin

This repository contains the officially supported Payload Cloud Storage plugin. It extends Payload to allow you to store all uploaded media in third-party permanent storage.

#### Requirements

- Payload version `1.0.16` or higher is required

## Usage

Install this plugin within your Payload as follows:

```ts
import { buildConfig } from 'payload/config';
import path from 'path';
import Users from './collections/Users';
import { cloudStorage } from '../../src/plugin';

export default buildConfig({
  plugins: [
  	cloudStorage({
      collections: [{
        // options here
      }]
    }),
  ],
  // The rest of your config goes here
});
```

## Features

**Adapter-based Implementation**
This plugin supports the following adapters:

- Azure Blob Storage

## Plugin options

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option                        | Description |
| ----------------------------- | ----------- |
| **[`collections`]** *         | Array of collection-specific options to enable the plugin for. |

#### Collection-specific options

| Option                       | Description                                                                                                                                                                                                      |
|------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **[`slug`]** *               | The collection slug to extend.                                                                                                                                                                 |

#### Local sandbox & plugin development

This repository includes a local development environment for local testing and development of this plugin. To run the local sandbox, follow the instructions below.

1. Make sure you have Node and a MongoDB to work with
1. Clone the repo
1. `yarn` in both the root folder of the repo, and the `./dev` folder
1. `cd` into `./dev` and run `cp .env.example .env` to create an `.env` file
1. Open your newly created `./dev/.env` file and _completely_ fill out each property
1. Run `yarn dev` within the `/dev` folder
1. Open `http://localhost:3000/admin` in your browser

## Questions

Please contact [Payload](dev@payloadcms.com) with any questions about using this plugin.
