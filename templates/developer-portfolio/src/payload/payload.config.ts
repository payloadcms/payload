import { payloadCloud } from '@payloadcms/plugin-cloud'
import formBuilder from '@payloadcms/plugin-form-builder'
import seo from '@payloadcms/plugin-seo'
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig } from 'payload/config'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Projects } from './collections/Projects'
import { Technologies } from './collections/Technologies'
import { Users } from './collections/Users'
import BeforeDashboard from './components/BeforeDashboard'
import { seed } from './endpoints/seed'
import { Header } from './globals/Header'
import { Profile } from './globals/Profile'

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

const plugins = [
  formBuilder({
    fields: {
      payment: false,
      checkbox: false,
      country: false,
      email: true,
      message: true,
      number: false,
      text: true,
      textarea: true,
      select: false,
      state: false,
    },
  }),
  seo({
    collections: ['pages', 'projects'],
    uploadsCollection: 'media',
  }),
  payloadCloud(),
]

export default buildConfig({
  admin: {
    components: {
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: [BeforeDashboard],
    },
  },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [Media, Pages, Projects, Technologies, Users],
  globals: [Header, Profile],
  plugins,
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  endpoints: [
    // The seed endpoint is used to populate the database with some example data
    // You should delete this endpoint before deploying your site to production
    {
      path: '/seed',
      method: 'get',
      handler: seed,
    },
  ],
})
