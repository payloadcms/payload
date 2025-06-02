// @ts-strict-ignore

import type { AdminViewConfig } from '../../admin/views/index.js'
import type { SanitizedConfig } from '../../config/types.js'
import type { AddToImportMap, Imports, InternalImportMap } from './index.js'

import { iterateCollections } from './iterateCollections.js'
import { genImportMapIterateFields } from './iterateFields.js'
import { iterateGlobals } from './iterateGlobals.js'

export function iterateConfig({
  addToImportMap,
  baseDir,
  config,
  importMap,
  imports,
}: {
  addToImportMap: AddToImportMap
  baseDir: string
  config: SanitizedConfig
  importMap: InternalImportMap
  imports: Imports
}) {
  iterateCollections({
    addToImportMap,
    baseDir,
    collections: config.collections,
    config,
    importMap,
    imports,
  })

  iterateGlobals({
    addToImportMap,
    baseDir,
    config,
    globals: config.globals,
    importMap,
    imports,
  })

  if (config?.blocks) {
    const blocks = Object.values(config.blocks)
    if (blocks?.length) {
      genImportMapIterateFields({
        addToImportMap,
        baseDir,
        config,
        fields: blocks,
        importMap,
        imports,
      })
    }
  }

  if (typeof config.admin?.avatar === 'object') {
    addToImportMap(config.admin?.avatar?.Component)
  }

  addToImportMap(config.admin?.components?.Nav)
  addToImportMap(config.admin?.components?.header)
  addToImportMap(config.admin?.components?.logout?.Button)
  addToImportMap(config.admin?.components?.graphics?.Icon)
  addToImportMap(config.admin?.components?.graphics?.Logo)

  addToImportMap(config.admin?.components?.actions)
  addToImportMap(config.admin?.components?.afterDashboard)
  addToImportMap(config.admin?.components?.afterLogin)
  addToImportMap(config.admin?.components?.afterNavLinks)
  addToImportMap(config.admin?.components?.beforeDashboard)
  addToImportMap(config.admin?.components?.beforeLogin)
  addToImportMap(config.admin?.components?.beforeNavLinks)

  addToImportMap(config.admin?.components?.providers)

  if (config.admin?.components?.views) {
    if (Object.keys(config.admin?.components?.views)?.length) {
      for (const key in config.admin?.components?.views) {
        const adminViewConfig = config.admin?.components?.views[key]
        addToImportMap(adminViewConfig?.Component)
      }
    }
  }

  if (config?.admin?.importMap?.generators?.length) {
    for (const generator of config.admin.importMap.generators) {
      generator({
        addToImportMap,
        baseDir,
        config,
        importMap,
        imports,
      })
    }
  }

  if (config?.admin?.dependencies) {
    for (const dependency of Object.values(config.admin.dependencies)) {
      addToImportMap(dependency.path)
    }
  }

  /*
  if (
    config?.editor &&
    typeof config.editor === 'object' &&
    config.editor.generateImportMap &&
    typeof config.editor.generateImportMap === 'function'
  ) {
    config.editor.generateImportMap({
      addToImportMap,
      baseDir,
      componentMap,
      config,
      importMap,
    })
  }*/ // No need to do that here since in the sanitized editor config, this root editor is already added to the field editor - and we already process that in iterateFields
}
