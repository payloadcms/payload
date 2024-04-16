# Payload Config Loader

This package is used within `@payloadcms/next` in order to load the config within Next.js server components and not have any of the config's code leak into the client-side JS bundle. It is included within the Next.js config's `serverComponentsExternalPackages` property so as to not be included in the bundle.

Without this approach, all client components referenced via the `payload.config.ts` file will be included into the client-side JS if the Payload Local API is used in a server component.

The package is transpiled to CommonJS because when Next.js detects a package as `serverComponentsExternalPackages`, the package is `require`d rather than imported with ESM.
