import React from 'react'
import { Link } from 'react-router-dom'
import { Banner } from 'payload/components'

import { SeedButton } from './SeedButton'

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
          <SeedButton />
          {' with a few products and pages to jump-start your new project, then '}
          <a href="/">visit your website</a>
          {' to see the results.'}
        </li>
        <li>
          {'Head over to '}
          <a
            href="https://dashboard.stripe.com/test/apikeys"
            target="_blank"
            rel="noopener noreferrer"
          >
            {'Stripe to obtain your API Keys'}
          </a>
          {
            '. Create a new account if needed, then copy them into your environment variables and restart your server. See the '
          }
          <a
            href="https://github.com/payloadcms/payload/blob/main/templates/ecommerce/README.md#stripe"
            target="_blank"
            rel="noopener noreferrer"
          >
            {'README'}
          </a>
          {' for more details.'}
        </li>
        <li>
          <Link to="/admin/collections/products">Link each of your products</Link>
          {' to Stripe by selecting the corresponding product using the dropdown under '}
          <i>Product Details</i>.
        </li>
        <li>
          If you created this repo using Payload Cloud, head over to GitHub and clone it to your
          local machine. It will be under the <i>GitHub Scope</i> that you selected when creating
          this project.
        </li>
        <li>
          {'Modify your '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            target="_blank"
            rel="noopener noreferrer"
          >
            collections
          </a>
          {' and add more '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            target="_blank"
            rel="noopener noreferrer"
          >
            fields
          </a>
          {' as needed. If you are new to Payload, we also recommend you check out the '}
          <a
            href="https://payloadcms.com/docs/getting-started/what-is-payload"
            target="_blank"
            rel="noopener noreferrer"
          >
            Getting Started
          </a>
          {' docs.'}
        </li>
        <li>
          Commit and push your changes to the repository to trigger a redeployment of your project.
        </li>
      </ul>
      {'Pro Tip: This block is a '}
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
