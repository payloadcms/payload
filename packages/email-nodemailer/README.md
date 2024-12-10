# Nodemailer Email Adapter for Payload

This adapter allows you to send emails using the [Nodemailer](https://nodemailer.com/) library.

It abstracts all of the email functionality that was in Payload by default in 2.x into a separate package.

**NOTE:** Configuring email in Payload 3.0 is now completely optional. However, you will receive a startup warning that email is not configured and also a message if you attempt to send an email.

## Installation

```sh
pnpm add @payloadcms/email-nodemailer nodemailer
```

## Usage

### Using nodemailer.createTransport

```ts
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'

export default buildConfig({
  email: nodemailerAdapter({
    defaultFromAddress: 'info@payloadcms.com',
    defaultFromName: 'Payload',
    // Any Nodemailer transport
    transport: await nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }),
  }),
})
```

### Using transportOptions

```ts
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export default buildConfig({
  email: nodemailerAdapter({
    defaultFromAddress: 'info@payloadcms.com',
    defaultFromName: 'Payload',
    // Nodemailer transportOptions
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
})
```

During development, if you pass nothing to `nodemailerAdapter`, it will use the [ethereal.email](https://ethereal.email) service.

This will log the ethereal.email details to console on startup.

```ts
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export default buildConfig({
  email: nodemailerAdapter(), // This will be the old ethereal.email functionality
})
```
