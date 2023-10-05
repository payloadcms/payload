import type { SanitizedConfig } from 'payload/config'

import webpack from 'webpack'

import { getProdConfig } from '../configs/prod'

type BuildAdminType = (options: { payloadConfig: SanitizedConfig }) => Promise<void>
export const buildAdmin: BuildAdminType = async ({ payloadConfig }) => {
  try {
    const webpackConfig = getProdConfig(payloadConfig)
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        // Handle errors here

        if (stats) {
          console.error(
            stats.toString({
              chunks: false,
              colors: true,
            }),
          )
        } else {
          console.error(err.message)
        }
      }
    })
  } catch (err) {
    console.error(err)
    throw new Error('Error: there was an error building the webpack prod config.')
  }
}
