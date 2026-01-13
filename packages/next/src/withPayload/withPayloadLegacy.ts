/* eslint-disable no-console */
import type { NextConfig } from 'next'

/**
 * Applies config options required to support Next.js versions before 16.1.0 and 16.1.0-canary.3.
 */
export const withPayloadLegacy = (nextConfig: NextConfig = {}): NextConfig => {
  if (process.env.PAYLOAD_PATCH_TURBOPACK_WARNINGS !== 'false') {
    // TODO: This warning is thrown because we cannot externalize the entry-point package for client-s3, so we patch the warning to not show it.
    // We can remove this once Next.js implements https://github.com/vercel/next.js/discussions/76991
    const turbopackWarningText =
      'Packages that should be external need to be installed in the project directory, so they can be resolved from the output files.\nTry to install it into the project directory by running'

    // TODO 4.0: Remove this once we drop support for Next.js 15.2.x
    const turbopackConfigWarningText = "Unrecognized key(s) in object: 'turbopack'"

    const consoleWarn = console.warn
    console.warn = (...args) => {
      // Force to disable serverExternalPackages warnings: https://github.com/vercel/next.js/issues/68805
      if (
        (typeof args[1] === 'string' && args[1].includes(turbopackWarningText)) ||
        (typeof args[0] === 'string' && args[0].includes(turbopackWarningText))
      ) {
        return
      }

      // Add Payload-specific message after turbopack config warning in Next.js 15.2.x or lower.
      // TODO 4.0: Remove this once we drop support for Next.js 15.2.x
      const hasTurbopackConfigWarning =
        (typeof args[1] === 'string' && args[1].includes(turbopackConfigWarningText)) ||
        (typeof args[0] === 'string' && args[0].includes(turbopackConfigWarningText))

      if (hasTurbopackConfigWarning) {
        consoleWarn(...args)
        consoleWarn(
          'Payload: You can safely ignore the "Invalid next.config" warning above. This only occurs on Next.js 15.2.x or lower. We recommend upgrading to the latest supported Next.js version to resolve this warning.',
        )
        return
      }

      consoleWarn(...args)
    }
  }

  const isBuild = process.env.NODE_ENV === 'production'
  const isTurbopackNextjs15 = process.env.TURBOPACK === '1'
  const isTurbopackNextjs16 = process.env.TURBOPACK === 'auto'

  if (isBuild && (isTurbopackNextjs15 || isTurbopackNextjs16)) {
    throw new Error(
      'Your Next.js version does not support using Turbopack for production builds. The *minimum* Next.js version required for Turbopack Builds is 16.1.0. Please upgrade to the latest supported Next.js version to resolve this error.',
    )
  }

  const toReturn: NextConfig = {
    ...nextConfig,
    serverExternalPackages: [
      // serverExternalPackages = webpack.externals, but with turbopack support and an additional check
      // for whether the package is resolvable from the project root
      ...(nextConfig.serverExternalPackages || []),
      // External, because it installs import-in-the-middle and require-in-the-middle - both in the default serverExternalPackages list.
      '@sentry/nextjs',
    ],
  }

  return toReturn
}
