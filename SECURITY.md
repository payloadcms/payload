# Security Policy

## Reporting a Vulnerability

Please report any security issues or concerns to [security@payloadcms.com](mailto:security@payloadcms.com).

## Development Environments

Development mode enables framework debugging features that can expose source code, stack traces, and server-component props to the browser. This debug output can include sensitive values. Payload authentication does not restrict access to framework development tooling.

Run production builds for deployed applications, and restrict development-server access to trusted developers.

Reports limited to expected development diagnostics, without production impact or a demonstrated security-boundary bypass, are generally considered informational. Reports involving production disclosure or bypasses of development-server origin, host, or access protections remain welcome.

## Rewards and Recognition

Any report that is validated and addressed is greatly appreciated. When a validated report requires a published advisory (for example, a GitHub Security Advisory / GHSA), the original reporter will be credited in that advisory. When submitting reports, be sure to include your GitHub username to receive credit. We do not offer monetary rewards or bug bounties for security reports.

## Software Bill of Materials (SBOM)

Each Payload v4 beta release on GitHub includes `payload-sboms-<version>.zip`. For example, the zip for 4.0.0-beta.4 is at:

https://github.com/payloadcms/payload/releases/download/v4.0.0-beta.4/payload-sboms-4.0.0-beta.4.zip

The zip has one folder, `payload-sboms-<version>/`, with one SBOM per published npm package in two formats:

- CycloneDX 1.6 JSON: `<package>-<version>.cdx.json`
- SPDX 2.3 JSON: `<package>-<version>.spdx.json`

`<package>` is the npm name without `@`, with `/` replaced by `-`. For example, `@payloadcms/db-postgres` is `payloadcms-db-postgres-4.0.0-beta.4.cdx.json`.

Each SBOM lists the production dependencies that Payload built and tested the package with, from the repository lockfile. Other `@payloadcms/*` packages appear with their release version. Direct peer dependencies (for example `next` or `payload`) are excluded, because your project provides them, unless the package also lists them in `dependencies`. Peer dependencies of transitive dependencies can appear.

For the dependencies your project installs, generate an SBOM from your own lockfile.

To verify the files after you unzip, run `sha256sum -c SHA256SUMS` in the `payload-sboms-<version>/` folder.
