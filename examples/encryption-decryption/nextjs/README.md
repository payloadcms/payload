# Encryption / Decryption Example Website

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) that fetches data from [Payload](https://payloadcms.com).

This example repo was made explicitly to demonstrate the power and simplicity of the integrating encryption and decryption into your Payload application.

## Getting Started

### Payload

First you'll need a running Payload app. If you have not done so already, open up the `cms` folder and follow the setup instructions. Take note of your server URL, you'll need this in the next step.

### Next.js App

1. Clone this repo
2. `cd` into this directory and run `yarn` or `npm install`
3. `cp .env.example .env` to copy the example environment variables
4. `yarn dev` or `npm run dev` to start the server
5. `open http://localhost:3000` to see the result

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Once running, you will find a settings page on your local environment. Here you'll see the Date of birth field that encrypted and then decrypted to view.

You can also start editing the Settings to add more fields to encrypt etc.

## Learn More

To learn more about Payload and Next.js, take a look at the following resources:

- [Payload Documentation](https://payloadcms.com/docs) - learn about Payload features and API.
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Payload GitHub repository](https://github.com/payloadcms/payload/) as well as [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Payload deployment documentation](https://payloadcms.com/docs/production/deployment) or the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
