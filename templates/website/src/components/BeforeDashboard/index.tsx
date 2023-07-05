import React from 'react'
import { Banner } from 'payload/components'

import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>
      Here&apos;s what to do next:
      <ul className={`${baseClass}__instructions`}>
        <li>
          Head over to GitHub and clone the new repository to your local machine (it will be under
          the <i>GitHub Scope</i> that you selected when creating this project).
        </li>
        <li>
          Build out your{' '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            target="_blank"
            rel="noopener noreferrer"
          >
            collections
          </a>{' '}
          and add more{' '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            target="_blank"
            rel="noopener noreferrer"
          >
            fields
          </a>{' '}
          as needed. If you are new to Payload, we also recommend you check out the{' '}
          <a
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            target="_blank"
            rel="noopener noreferrer"
          >
            Getting Started
          </a>{' '}
          docs.
        </li>
        <li>
          Commit and push your changes to the repository to trigger a redeployment of your project.
        </li>
      </ul>
      Pro Tip: This block is a{' '}
      <a
        href={'https://payloadcms.com/docs/admin/components#base-component-overrides'}
        target="_blank"
        rel="noopener noreferrer"
      >
        custom component
      </a>
      , you can remove it at any time by updating your <strong>payload.config</strong>.
    </div>
  )
}

export default BeforeDashboard
