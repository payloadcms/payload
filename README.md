# Payload Cloud Plugin

This is the official Payload Cloud plugin that is meant to be installed for any project that deploys on Payload Cloud.

## What it does

Payload Cloud gives you everything you need to deploy Payload to production, and this plugin is responsible for connecting your Payload instance to the resources that Payload Cloud provides.

#### File storage

Payload Cloud gives you S3 file storage backed by Cloudflare as a CDN, and this plugin extends Payload so that all of your media will be stored in S3 rather than locally.

## Future enhancements


#### API CDN

In the future, this plugin will also ship with a way to dynamically cache API requests as well as purge them whenever a resource is updated. 

#### Email delivery

Payload is working with [Resend](https://resend.com) to provide an email delivery service out-of-the-box for all Payload Cloud customers. This will be coming soon.

### When it executes

This plugin will only execute if the required environment variables set by Payload Cloud are in place.