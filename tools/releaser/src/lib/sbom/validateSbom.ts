import type { SbomFormat, SbomPackage } from './formats.js'

export type CycloneDxComponent = {
  group?: string
  licenses?: unknown[]
  name: string
}

export type CycloneDxBom = {
  components: CycloneDxComponent[]
  metadata: { component: CycloneDxComponent }
  specVersion: string
}

export type SpdxPackage = {
  licenseDeclared?: string
  name: string
  SPDXID: string
  supplier?: string
}

export type SpdxRelationship = {
  relatedSpdxElement: string
  relationshipType: string
  spdxElementId: string
}

export type SpdxDocument = {
  packages: SpdxPackage[]
  relationships: SpdxRelationship[]
  spdxVersion: string
}

/**
 * Checks one generated SBOM against the package it describes. Returns one line per
 * problem, each prefixed with the package and format; an empty list means valid.
 */
export const validateSbom = ({
  document,
  format,
  pkg,
}: {
  document: unknown
  format: SbomFormat
  pkg: SbomPackage
}): string[] => {
  const problems =
    format.id === 'cyclonedx'
      ? validateCycloneDx({ document, pkg })
      : validateSpdx({ document, pkg })

  return problems.map((problem) => `${pkg.name} (${format.labelSuffix}): ${problem}`)
}

/** The package that `SPDXRef-DOCUMENT` DESCRIBES, i.e. the SBOM's subject. */
export const findSpdxRoot = (document: SpdxDocument): SpdxPackage | undefined => {
  const rootId = document.relationships.find(
    (relationship) =>
      relationship.spdxElementId === 'SPDXRef-DOCUMENT' &&
      relationship.relationshipType === 'DESCRIBES',
  )?.relatedSpdxElement

  return document.packages.find((spdxPackage) => spdxPackage.SPDXID === rootId)
}

export const isCycloneDxBom = (value: unknown): value is CycloneDxBom =>
  isRecord(value) &&
  typeof value.specVersion === 'string' &&
  isRecord(value.metadata) &&
  isCycloneDxComponent(value.metadata.component) &&
  Array.isArray(value.components) &&
  value.components.every(isCycloneDxComponent)

export const isSpdxDocument = (value: unknown): value is SpdxDocument =>
  isRecord(value) &&
  typeof value.spdxVersion === 'string' &&
  Array.isArray(value.packages) &&
  value.packages.every(isSpdxPackage) &&
  Array.isArray(value.relationships) &&
  value.relationships.every(isSpdxRelationship)

const validateCycloneDx = ({
  document,
  pkg,
}: {
  document: unknown
  pkg: SbomPackage
}): string[] => {
  if (!isCycloneDxBom(document)) {
    return ['not a CycloneDX document']
  }

  const problems: string[] = []

  if (document.specVersion !== '1.6') {
    problems.push(`specVersion is ${document.specVersion}, expected 1.6`)
  }

  const rootName = toCycloneDxName(document.metadata.component)
  if (rootName !== pkg.name) {
    problems.push(`root is ${rootName}, expected ${pkg.name}`)
  }

  for (const component of document.components) {
    if (!component.licenses?.length) {
      problems.push(`${toCycloneDxName(component)} has no license`)
    }
  }

  const componentNames = new Set(document.components.map(toCycloneDxName))
  problems.push(...findMissingDependencies({ names: componentNames, pkg }))

  return problems
}

const validateSpdx = ({ document, pkg }: { document: unknown; pkg: SbomPackage }): string[] => {
  if (!isSpdxDocument(document)) {
    return ['not an SPDX 2.3 document']
  }

  const problems: string[] = []

  if (document.spdxVersion !== 'SPDX-2.3') {
    problems.push(`spdxVersion is ${document.spdxVersion}, expected SPDX-2.3`)
  }

  const root = findSpdxRoot(document)
  if (!root) {
    problems.push('no root package (DESCRIBES relationship)')
  } else if (root.name !== pkg.name) {
    problems.push(`root is ${root.name}, expected ${pkg.name}`)
  }

  for (const spdxPackage of document.packages) {
    if (!spdxPackage.licenseDeclared || spdxPackage.licenseDeclared === 'NOASSERTION') {
      problems.push(`${spdxPackage.name} has no license`)
    }
  }

  const packageNames = new Set(document.packages.map((spdxPackage) => spdxPackage.name))
  problems.push(...findMissingDependencies({ names: packageNames, pkg }))

  return problems
}

const findMissingDependencies = ({
  names,
  pkg,
}: {
  names: Set<string>
  pkg: SbomPackage
}): string[] =>
  pkg.dependencyNames
    .filter((dependencyName) => !names.has(dependencyName))
    .map((dependencyName) => `direct dependency ${dependencyName} missing`)

const toCycloneDxName = (component: CycloneDxComponent): string =>
  component.group ? `${component.group}/${component.name}` : component.name

const isCycloneDxComponent = (value: unknown): value is CycloneDxComponent =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  (value.group === undefined || typeof value.group === 'string') &&
  (value.licenses === undefined || Array.isArray(value.licenses))

const isSpdxPackage = (value: unknown): value is SpdxPackage =>
  isRecord(value) &&
  typeof value.name === 'string' &&
  typeof value.SPDXID === 'string' &&
  (value.licenseDeclared === undefined || typeof value.licenseDeclared === 'string') &&
  (value.supplier === undefined || typeof value.supplier === 'string')

const isSpdxRelationship = (value: unknown): value is SpdxRelationship =>
  isRecord(value) &&
  typeof value.relatedSpdxElement === 'string' &&
  typeof value.relationshipType === 'string' &&
  typeof value.spdxElementId === 'string'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
