import formBuilder from '@payloadcms/plugin-form-builder'
import seo from '@payloadcms/plugin-seo'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

import { buildConfig } from 'payload/config'

import { serverUrl } from './app/_utils/api'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Projects } from './collections/Projects'
import { Technologies } from './collections/Technologies'
import { Users } from './collections/Users'
import { Header } from './globals/Header'
import { Profile } from './globals/Profile'

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
]

export default buildConfig({
  serverURL: serverUrl || '',
  collections: [Media, Pages, Projects, Technologies, Users],
  globals: [Header, Profile],
  plugins,
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
