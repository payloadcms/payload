import React from 'react'

import { SeedButton } from './SeedButton'
import './index.css'

const baseClass = 'getting-started'

export const GettingStarted: React.FC = () => {
  return (
    <section className={`card ${baseClass}`}>
      <h2 className={`${baseClass}__heading`}>Get started with your new store</h2>
      <ol className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' with a few products and pages to jump-start your new project, then '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">visit your website</a>
          {' to see the results.'}
        </li>
        <li>
          {'Head over to '}
          <a
            href="https://dashboard.stripe.com/test/apikeys"
            rel="noopener noreferrer"
            target="_blank"
          >
            Stripe to obtain your API Keys
          </a>
          {
            '. Create a new account if needed, then copy them into your environment variables and restart your server. See the '
          }
          <a
            href="https://github.com/payloadcms/payload/blob/main/templates/ecommerce/README.md#stripe"
            rel="noopener noreferrer"
            target="_blank"
          >
            README
          </a>
          {' for more details.'}
        </li>
        <li>
          {'Modify your '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            rel="noopener noreferrer"
            target="_blank"
          >
            collections
          </a>
          {' and add more '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            fields
          </a>
          {' as needed. If you are new to Payload, we also recommend you check out the '}
          <a
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            rel="noopener noreferrer"
            target="_blank"
          >
            Getting Started
          </a>
          {' docs.'}
        </li>
      </ol>
      <p className={`${baseClass}__tip`}>
        {'Pro Tip: This block is a '}
        <a
          href="https://payloadcms.com/docs/custom-components/dashboard"
          rel="noopener noreferrer"
          target="_blank"
        >
          dashboard widget
        </a>
        . Remove it with <strong>Edit Dashboard</strong>, or delete it from the{' '}
        <strong>payload.config</strong>.
      </p>
    </section>
  )
}
