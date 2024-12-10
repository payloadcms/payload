# Resend REST Email Adapter

This adapter allows you to send emails using the [Resend](https://resend.com) REST API.

## Installation

```sh
pnpm add @payloadcms/email-resend
```

## Usage

- Sign up for a [Resend](https://resend.com) account
- Set up a domain
- Create an API key
- Set API key as RESEND_API_KEY environment variable
- Configure your Payload config

```ts
// payload.config.js
import { resendAdapter } from '@payloadcms/email-resend'

export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
})
```
