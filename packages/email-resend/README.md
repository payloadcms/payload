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

## Idempotency keys

A send can time out after Resend already took it, so a retry can send the same email twice. To stop that, pass `getIdempotencyKey`. It gets the email and returns the key to send in the `Idempotency-Key` header. Resend won't send a second email for a key it saw in the last 24 hours.

A retry has to send the same key and the same email. If the email changed, Resend returns a 409. So build the key from something stable like a job or record id, and keep the recipients and content the same. `messageId` is one way to carry the key. The adapter doesn't send that field to Resend.

```ts
// payload.config.js
export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: 'dev@payloadcms.com',
    defaultFromName: 'Payload CMS',
    apiKey: process.env.RESEND_API_KEY || '',
    getIdempotencyKey: (message) => message.messageId,
  }),
})

// When you send
await payload.sendEmail({
  messageId: `booking-confirmation-${booking.id}`,
  to: booking.email,
  subject: 'Your booking',
  text: 'See you soon',
})
```
