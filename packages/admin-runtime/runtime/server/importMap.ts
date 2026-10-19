import type { ImportMap } from 'payload'

import * as LexicalClient from '@payloadcms/richtext-lexical/client'
import * as LexicalRSC from '@payloadcms/richtext-lexical/rsc'
import * as UIClient from '@payloadcms/ui'
import * as UIRSC from '@payloadcms/ui/rsc'

/**
 * Every component a prebuilt Payload package can contribute to an import map. In the RSC environment
 * the `'use client'` namespaces are client references, which also pulls their implementations into the
 * prebuilt browser and SSR bundles.
 */
export const builtInImportMap: ImportMap = Object.fromEntries(
  Object.entries({
    '@payloadcms/richtext-lexical/client': LexicalClient,
    '@payloadcms/richtext-lexical/rsc': LexicalRSC,
    '@payloadcms/ui': UIClient,
    '@payloadcms/ui/rsc': UIRSC,
  }).flatMap(([specifier, namespace]) =>
    Object.entries(namespace).map(([exportName, value]) => [`${specifier}#${exportName}`, value]),
  ),
) as ImportMap
