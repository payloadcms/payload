'use client'

import type { CodeFieldClient, CodeFieldClientProps } from 'payload'

import { CodeField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import { languages } from './shared.js'

const languageKeyToMonacoLanguageMap = {
  plaintext: 'plaintext',
  ts: 'typescript',
  tsx: 'typescript',
}

export const Code: React.FC<CodeFieldClientProps> = ({
  autoComplete,
  field,
  forceRender,
  path,
  permissions,
  readOnly,
  renderedBlocks,
  schemaPath,
  validate,
}) => {
  const languageField = useFormFields(([fields]) => fields['language'])

  const language: string =
    (languageField?.value as string) || (languageField.initialValue as string) || 'typescript'

  const label = languages[language as keyof typeof languages]

  const props: CodeFieldClient = useMemo<CodeFieldClient>(
    () => ({
      ...field,
      type: 'code',
      admin: {
        ...field.admin,
        description: 'test',
        editorOptions: {
          onMount: (editor, monaco) => {
            // Set module resolution to NodeNext to enable autocompletion
            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              allowNonTsExtensions: true,
              module: monaco.languages.typescript.ModuleKind.ESNext,
              moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
              target: monaco.languages.typescript.ScriptTarget.ESNext,
              typeRoots: ['node_modules/@types'],
            })

            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
              noSemanticValidation: false,
              noSyntaxValidation: false,
            })

            const libUri = 'node_modules/@types/payload/index.d.ts'

            const run = async () => {
              const types = await fetch('https://unpkg.com/payload@latest/dist/index.d.ts')
              const libSource = await types.text()
              monaco.languages.typescript.typescriptDefaults.addExtraLib(libSource, libUri)
            }
            void run()
          },
        } as any,
        label,
        language: languageKeyToMonacoLanguageMap[language] || language,
      },
    }),
    [field, language, label],
  )

  const key = `${field.name}-${language}-${label}`

  return (
    props && (
      <CodeField
        autoComplete={autoComplete}
        field={props}
        forceRender={forceRender}
        key={key}
        onMount={(editor, monaco) => {
          console.log('editor mounted')
          // Set module resolution to NodeNext to enable autocompletion
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            paths: {
              payload: ['file:///node_modules/payload/index.d.ts'],
            },
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            typeRoots: ['node_modules/@types', 'node_modules/payload'],
          })
          const run = async () => {
            const types = await fetch('https://unpkg.com/payload@latest/dist/index.d.ts')
            const typesText = await types.text()
            monaco.languages.typescript.typescriptDefaults.addExtraLib(
              typesText,
              'file:///node_modules/payload/index.d.ts',
            )
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
