import type { Project } from 'ts-morph'

/** A package.json file exposed to transforms. Transforms mutate `data` only. */
export type PackageJsonFile = {
  /** Parsed, mutable package.json contents. */
  data: Record<string, unknown>
  /** Absolute path to the package.json. */
  path: string
}

export type TransformContext = {
  packageJsons: PackageJsonFile[]
  project: Project
}

export type TransformResult = {
  filesChanged: string[]
  notes?: string[]
}

export type Transform = {
  apply: (ctx: TransformContext) => Promise<TransformResult> | TransformResult
  description: string
  name: string
}
