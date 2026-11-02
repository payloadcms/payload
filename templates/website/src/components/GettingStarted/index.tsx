import React from 'react'

import { SeedButton } from './SeedButton'
import './index.css'

const baseClass = 'getting-started'

const GettingStarted: React.FC = () => {
  return (
    <section className={`card ${baseClass}`}>
      <h2 className={`${baseClass}__heading`}>Get started with your new site</h2>
      <ol className={`${baseClass}__instructions`}>
        <li>
          <SeedButton />
          {' with a few pages, posts, and projects to jump-start your new site, then '}
          <a href="/" target="_blank">
            visit your website
          </a>
          {' to see the results.'}
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
        <li>
          Commit and push your changes to the repository to trigger a redeployment of your project.
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

export default GettingStarted
