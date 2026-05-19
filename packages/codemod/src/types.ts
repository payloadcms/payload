import type { Project } from 'ts-morph'

export type TransformContext = {
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
