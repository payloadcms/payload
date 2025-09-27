'use client'

import type { CodeFieldClient, CodeFieldClientProps } from 'payload'

import { CodeField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

export type AdditionalCodeComponentProps = {
  /**
   * @default first key of the `languages` prop
   */
  defaultLanguage?: string
  /**
   * @default
   * {
   *  js: 'JavaScript',
   *  plaintext: 'Plain Text',
   *  ts: 'TypeScript',
   * }
   */
  languages?: Record<string, string>
  /**
   * Override the name of the block.
   *
   * @default 'Code'
   */
  slug?: string
  /**
   * Configure typescript settings for the editor
   */
  typescript?: {
    /**
     * Additional types to fetch and include in the editor for autocompletion.
     *
     * For example, to include types for payload, you would set this to
     *
     * [{ url: 'https://unpkg.com/payload@latest/dist/index.d.ts', filePath: 'file:///node_modules/payload/index.d.ts' }]
     */
    fetchTypes?: Array<{
      filePath: string
      url: string
    }>
    /**
     * @default undefined
     */
    paths?: Record<string, string[]>
    /**
     * @default "ESNext"
     */
    target?: string
    /**
     * @default ['node_modules/@types']
     */
    typeRoots?: string[]
  }
}

export const CodeComponent: React.FC<AdditionalCodeComponentProps & CodeFieldClientProps> = ({
  autoComplete,
  field,
  forceRender,
  languages = {
    js: 'JavaScript',
    plaintext: 'Plain Text',
    ts: 'TypeScript',
  },
  path,
  permissions,
  readOnly,
  renderedBlocks,
  schemaPath,
  typescript,
  validate,
}) => {
  const languageField = useFormFields(([fields]) => fields['language'])

  const language: string =
    (languageField?.value as string) || (languageField?.initialValue as string) || 'typescript'

  const label = languages[language]

  const props: CodeFieldClient = useMemo<CodeFieldClient>(
    () => ({
      ...field,
      type: 'code',
      admin: {
        ...field.admin,
        editorOptions: {},
        language,
      },
    }),
    [field, language],
  )

  const key = `${field.name}-${language}-${label}`

  return (
    props && (
      <CodeField
        autoComplete={autoComplete}
        field={props}
        forceRender={forceRender}
        key={key}
        onMount={(_editor, monaco) => {
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            allowNonTsExtensions: true,
            // Set module resolution to NodeJs to enable autocompletion
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            paths: typescript?.paths,
            target: monaco.languages.typescript.ScriptTarget[
              typescript?.target ?? ('ESNext' as any)
            ] as any,
            typeRoots: typescript?.typeRoots ?? ['node_modules/@types'],
          })
          const run = async () => {
            if (
              typescript?.fetchTypes &&
              Array.isArray(typescript.fetchTypes) &&
              typescript.fetchTypes.length > 0
            ) {
              await Promise.all(
                typescript.fetchTypes.map(async (type) => {
                  const types = await fetch(type.url)
                  const typesText = await types.text()
                  monaco.languages.typescript.typescriptDefaults.addExtraLib(
                    typesText,
                    type.filePath,
                  )
                }),
              )
            }
          }
          void run()
        }}
        path={path}
        permissions={permissions}
        readOnly={readOnly}
        renderedBlocks={renderedBlocks}
        schemaPath={schemaPath}
        validate={validate}
      />
    )
  )
}
