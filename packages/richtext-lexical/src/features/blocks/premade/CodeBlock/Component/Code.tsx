'use client'

import type { CodeFieldClient, CodeFieldClientProps } from 'payload'

import { CodeField, useFormFields } from '@payloadcms/ui'
import React, { useId, useMemo } from 'react'

import { defaultLanguages } from './defaultLanguages.js'

export type AdditionalCodeComponentProps = {
  /**
   * @default first key of the `languages` prop
   */
  defaultLanguage?: string
  /**
   * @default all languages supported by Monaco Editor
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
     * By default, the editor will not perform semantic validation. This means that
     * while syntax errors will be highlighted, other issues like missing imports or incorrect
     * types will not be.
     *
     * @default false
     */
    enableSemanticValidation?: boolean
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
  languages = defaultLanguages,
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

  // unique id per component instance to ensure Monaco creates a distinct model
  // for each TypeScript code block. Using React's useId is SSR-safe and builtin.
  const instanceId = useId()

  const label = languages[language]

  const props: CodeFieldClient = useMemo<CodeFieldClient>(
    () => ({
      ...field,
      type: 'code',
      admin: {
        ...field.admin,
        editorOptions: {},
        editorProps: {
          // If typescript is set, @monaco-editor/react needs to set the URI to a .ts or .tsx file when it calls createModel().
          // Provide a unique defaultPath per instance so Monaco doesn't reuse the same model
          // across multiple code block instances. We use field.name + instanceId for debugability.
          defaultPath: language === 'ts' ? `file-${field.name}-${instanceId}.tsx` : undefined,
        },
        language,
      },
    }),
    [field, language, instanceId],
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
          monaco.editor.defineTheme('vs-dark', {
            base: 'vs-dark',
            colors: {
              'editor.background': '#222222',
            },
            inherit: true,
            rules: [],
          })

          monaco.editor.defineTheme('vs', {
            base: 'vs',
            colors: {
              'editor.background': '#f5f5f5',
            },
            inherit: true,
            rules: [],
          })
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            allowNonTsExtensions: true,
            // Set module resolution to NodeJs to enable autocompletion
            allowJs: true,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            noEmit: true,
            paths: typescript?.paths,
            reactNamespace: 'React',
            target: monaco.languages.typescript.ScriptTarget[
              typescript?.target ?? ('ESNext' as any)
            ] as any,
            typeRoots: typescript?.typeRoots ?? ['node_modules/@types'],
          })

          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: typescript?.enableSemanticValidation ? false : true,
            noSyntaxValidation: false,
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
