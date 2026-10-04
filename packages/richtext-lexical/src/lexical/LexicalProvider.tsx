'use client'
import type { EditorChildrenComponentProps } from '@lexical/react/ReactExtension'
import type {
  AnyLexicalExtension,
  EditorState,
  LexicalEditor,
  SerializedEditorState,
} from 'lexical'

import { getExtensionDependencyFromEditor, LexicalBuilder } from '@lexical/extension'
import { ReactExtension } from '@lexical/react/ReactExtension'
import { ReactProviderExtension } from '@lexical/react/ReactProviderExtension'
import { useEditDepth } from '@payloadcms/ui'
import { configExtension, defineExtension } from 'lexical'
import * as React from 'react'
import { createContext, use, useLayoutEffect, useMemo } from 'react'

import type { LexicalRichTextFieldProps } from '../types/index.js'
import type { SanitizedClientEditorConfig } from './config/types.js'

import { useRichTextView } from '../field/RichTextViewProvider.js'
import {
  EditorConfigProvider,
  useEditorConfigContext,
} from './config/client/EditorConfigProvider.js'
import { LexicalEditor as LexicalEditorComponent } from './LexicalEditor.js'
import { getEnabledNodes } from './nodes/index.js'

export type LexicalProviderProps = {
  composerKey: string
  editorConfig: SanitizedClientEditorConfig
  fieldProps: LexicalRichTextFieldProps
  isSmallWidthViewport: boolean
  onChange: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>) => void
  readOnly: boolean
  rtl?: boolean
  value: SerializedEditorState
}

const NestProviders = ({
  children,
  providers,
}: {
  children: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: any[]
}) => {
  if (!providers?.length) {
    return children
  }
  const Component = providers[0]
  if (providers.length > 1) {
    return (
      <Component>
        <NestProviders providers={providers.slice(1)}>{children}</NestProviders>
      </Component>
    )
  }
  return <Component>{children}</Component>
}

type EditorConfigProviderProps = Omit<React.ComponentProps<typeof EditorConfigProvider>, 'children'>

/**
 * Lexical renders `EditorChildren` itself, so we can't pass props to it directly.
 * Instead, `LexicalProvider` passes them through this context.
 */
const EditorConfigProviderPropsContext = createContext<EditorConfigProviderProps | null>(null)

export const LexicalProvider: React.FC<LexicalProviderProps> = (props) => {
  const {
    composerKey,
    editorConfig,
    fieldProps,
    isSmallWidthViewport,
    onChange,
    readOnly,
    rtl,
    value,
  } = props

  const { currentView, views } = useRichTextView()

  const parentContext = useEditorConfigContext()

  const editDepth = useEditDepth()

  const editorContainerRef = React.useRef<HTMLDivElement>(null)

  // useMemo for the initialConfig that depends on readOnly and value
  const initialConfig = useMemo<AnyLexicalExtension>(() => {
    if (value && typeof value !== 'object') {
      throw new Error(
        'The value passed to the Lexical editor is not an object. This is not supported. Please remove the data from the field and start again. This is the value that was passed in: ' +
          JSON.stringify(value),
      )
    }

    if (value && Array.isArray(value) && !('root' in value)) {
      throw new Error(
        'You have tried to pass in data from the old Slate editor to the new Lexical editor. The data structure is different, thus you will have to migrate your data. We offer a one-line migration script which migrates all your rich text fields: https://payloadcms.com/docs/lexical/migration#migration-via-migration-script-recommended',
      )
    }

    if (value && 'jsonContent' in value) {
      throw new Error(
        'You have tried to pass in data from payload-plugin-lexical. The data structure is different, thus you will have to migrate your data. Migration guide: https://payloadcms.com/docs/lexical/migration#migrating-from-payload-plugin-lexical',
      )
    }

    // Use the 'default' view if available, otherwise undefined
    const nodeViews = views?.[currentView]?.nodes

    return defineExtension({
      name: '@payloadcms/richtext-lexical/Editor',
      $initialEditorState: value != null ? JSON.stringify(value) : undefined,
      dependencies: [
        configExtension(ReactExtension, { EditorChildrenComponent: EditorChildren }),
        ...editorConfig.features.extensions,
      ],
      editable: readOnly !== true,
      namespace: editorConfig.lexical.namespace,
      nodes: getEnabledNodes({
        editorConfig,
        nodeViews,
      }),
      onError: (error: Error) => {
        throw error
      },
      theme: editorConfig.lexical.theme,
    })
    // Important: do not add readOnly and value to the dependencies array. This will cause the entire lexical editor to re-render if the document is saved, which will
    // cause the editor to lose focus.
  }, [editorConfig, views, currentView])

  const editorConfigProviderProps = useMemo<EditorConfigProviderProps>(
    () => ({
      editorConfig,
      editorContainerRef,
      fieldProps,
      /**
       * Parent editor is not truly the parent editor, if the current editor is part of a drawer and the parent editor is the main editor.
       */
      parentContext: parentContext?.editDepth === editDepth ? parentContext : undefined,
    }),
    [editDepth, editorConfig, fieldProps, parentContext],
  )

  if (!initialConfig) {
    return <p>Loading...</p>
  }

  // We need to add initialConfig.editable to the key to force a re-render when the readOnly prop changes.
  // Without it, there were cases where lexical editors inside drawers turn readOnly initially - a few miliseconds later they turn editable, but the editor does not re-render and stays readOnly.
  // We also add currentView to force re-render when the view changes.
  return (
    <EditorConfigProviderPropsContext value={editorConfigProviderProps}>
      <ExtensionComposer
        extension={initialConfig}
        key={composerKey + initialConfig.editable + currentView}
      >
        <LexicalEditorComponent
          editorConfig={editorConfig}
          editorContainerRef={editorContainerRef}
          isSmallWidthViewport={isSmallWidthViewport}
          onChange={onChange}
          rtl={rtl}
        />
      </ExtensionComposer>
    </EditorConfigProviderPropsContext>
  )
}

/**
 * For each editor, a function that turns its extensions off again. Calling it removes
 * everything the extensions added to the editor, like commands, listeners and node transforms.
 */
const editorRegistrations = new WeakMap<LexicalEditor, () => void>()

/**
 * Creates the Lexical editor from the given extension and turns its extensions on.
 *
 * Lexical has its own component for this, `LexicalExtensionComposer`, but we can't use it: it
 * destroys the editor when its effect is cleaned up. React sometimes cleans up effects without
 * removing the component from the page, for example when a Suspense boundary above it shows its
 * fallback again. Once the content is visible again, React runs the effects again. The editor
 * would still be on the page, but none of its extensions would work anymore.
 *
 * This component never destroys the editor. It turns the extensions off when the effect is
 * cleaned up, and turns them on again when the effect runs again.
 */
function ExtensionComposer({
  children,
  extension,
}: {
  children: React.ReactNode
  extension: AnyLexicalExtension
}) {
  const { builder, editor } = useMemo(() => {
    const builder = LexicalBuilder.fromExtensions([
      ReactProviderExtension,
      // We render the content editable ourselves, in LexicalEditorComponent
      configExtension(ReactExtension, { contentEditable: null }),
      extension,
    ])
    const editor = builder.constructEditor()
    // Turn the extensions on right away, so the editor already has its initial content
    // when the content editable is rendered for the first time
    editorRegistrations.set(editor, builder.registerEditor(editor))
    return { builder, editor }
  }, [extension])

  // useLayoutEffect runs before any useEffect. Plugins register their commands in useEffect, so
  // after a cleanup, the extensions are turned on again before the plugins - like on the first render.
  useLayoutEffect(() => {
    if (!editorRegistrations.has(editor)) {
      // Lexical only sets the initial content the first time, so this keeps the user's changes
      editorRegistrations.set(editor, builder.registerEditor(editor))
    }
    return () => {
      editorRegistrations.get(editor)?.()
      editorRegistrations.delete(editor)
    }
  }, [builder, editor])

  const { Component } = getExtensionDependencyFromEditor(editor, ReactExtension).output

  return <Component>{children}</Component>
}

function EditorChildren({ children }: EditorChildrenComponentProps) {
  const editorConfigProviderProps = use(EditorConfigProviderPropsContext)

  if (!editorConfigProviderProps) {
    throw new Error('EditorChildren must be rendered within a LexicalProvider')
  }

  return (
    <EditorConfigProvider {...editorConfigProviderProps}>
      <NestProviders providers={editorConfigProviderProps.editorConfig.features.providers}>
        {children}
      </NestProviders>
    </EditorConfigProvider>
  )
}
