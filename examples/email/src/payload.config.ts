
import dotenv from 'dotenv'
import path from 'path'
import { buildConfig } from 'payload/config'

import Users from './collections/Users'
import Newsletter from './collections/Newsletter'

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

const mockModulePath = path.resolve(__dirname, './emptyModule.js')

export default buildConfig({
  admin: {
    webpack: config => ({
      ...config,
      resolve: {
        ...config?.resolve,
        alias: [
          'fs',
          'handlebars',
          'inline-css',
          path.resolve(__dirname, './email/transport'),
          path.resolve(__dirname, './email/generateEmailHTML'),
          path.resolve(__dirname, './email/generateForgotPasswordEmail'),
          path.resolve(__dirname, './email/generateVerificationEmail'),
        ].reduce(
          (aliases, importPath) => ({
            ...aliases,
            [importPath]: mockModulePath,
          }),
          config.resolve.alias,
        ),
      },
    }),
  },
  collections: [
    Newsletter,
    Users,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
