/**
 * Test-only builders for minimal SBOM documents in the shape `pnpm sbom` writes.
 * Defaults describe `@payloadcms/next` with one dependency, `@payloadcms/ui`.
 */

type FixtureOptions = {
  dependencyNames?: string[]
  name?: string
  version?: string
}

const AUTHOR_SUPPLIER = 'Person: Payload <dev@payloadcms.com> (https://payloadcms.com)'

export const cdx = ({
  components,
  dependencyNames = ['@payloadcms/ui'],
  name = '@payloadcms/next',
  specVersion = '1.6',
  version = '4.0.0-beta.3',
}: {
  components?: Record<string, unknown>[]
  specVersion?: string
} & FixtureOptions = {}) => ({
  bomFormat: 'CycloneDX',
  components:
    components ??
    dependencyNames.map((dependencyName) => ({
      ...splitName(dependencyName),
      licenses: [{ license: { id: 'MIT' } }],
      version,
    })),
  metadata: {
    component: { ...splitName(name), licenses: [{ license: { id: 'MIT' } }], version },
  },
  specVersion,
})

export const spdxDoc = ({
  dependencyLicense = 'MIT',
  dependencyNames = ['@payloadcms/ui'],
  hasDescribes = true,
  name = '@payloadcms/next',
  version = '4.0.0-beta.3',
}: {
  dependencyLicense?: string
  hasDescribes?: boolean
} & FixtureOptions = {}) => ({
  packages: [
    {
      licenseDeclared: 'MIT',
      name,
      SPDXID: 'SPDXRef-RootPackage',
      supplier: AUTHOR_SUPPLIER,
      versionInfo: version,
    },
    ...dependencyNames.map((dependencyName, index) => ({
      licenseDeclared: dependencyLicense,
      name: dependencyName,
      SPDXID: `SPDXRef-Package-${index}`,
      supplier: AUTHOR_SUPPLIER,
      versionInfo: version,
    })),
  ],
  relationships: [
    ...(hasDescribes
      ? [
          {
            relatedSpdxElement: 'SPDXRef-RootPackage',
            relationshipType: 'DESCRIBES',
            spdxElementId: 'SPDXRef-DOCUMENT',
          },
        ]
      : []),
    ...dependencyNames.map((_, index) => ({
      relatedSpdxElement: `SPDXRef-Package-${index}`,
      relationshipType: 'DEPENDS_ON',
      spdxElementId: 'SPDXRef-RootPackage',
    })),
  ],
  SPDXID: 'SPDXRef-DOCUMENT',
  spdxVersion: 'SPDX-2.3',
})

const splitName = (fullName: string): { group?: string; name: string } => {
  const [group, name] = fullName.split('/')
  if (name === undefined) {
    return { name: fullName }
  }
  return { group, name }
}
