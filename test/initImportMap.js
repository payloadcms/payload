import fs from 'fs'

export function initImportMap() {
  // create a new importMap.js with contents export const importMap = {} in app/(payload)/admin/importMap.js - delete existing file:
  fs.writeFileSync('app/(payload)/admin/importMap.js', 'export const importMap = {}')
}

void initImportMap()
