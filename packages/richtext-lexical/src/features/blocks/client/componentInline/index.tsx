'use client'

import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react'
const baseClass = 'inline-block'

import type { BlocksFieldClient, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  Drawer,
  EditDepthProvider,
  Form,
  formatDrawerSlug,
  FormSubmit,
  RenderFields,
  ShimmerEffect,
  useDocumentInfo,
  useEditDepth,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from 'lexical'
import { reduceFieldsToValues } from 'payload/shared'

import './index.scss'

import { v4 as uuid } from 'uuid'

import type { InlineBlockFields } from '../../server/nodes/InlineBlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { $isInlineBlockNode } from '../nodes/InlineBlocksNode.js'

type Props = {
  readonly formData: InlineBlockFields
  readonly nodeKey: string
}

type InlineBlockComponentContextType = {
  EditButton?: React.FC
  initialState: false | FormState | undefined
  InlineBlockContainer?: React.FC<{ children: React.ReactNode }>
  Label?: React.FC
  nodeKey?: string
  RemoveButton?: React.FC
}

const InlineBlockComponentContext = createContext<InlineBlockComponentContextType>({
  initialState: false,
})

export const useInlineBlockComponentContext = () => React.useContext(InlineBlockComponentContext)

export const InlineBlockComponent: React.FC<Props> = (props) => {
  const { formData, nodeKey } = props
  const [editor] = useLexicalComposerContext()
  const { i18n, t } = useTranslation<object, string>()
  const {
    fieldProps: {
      featureClientSchemaMap,
      initialLexicalFormState,
      permissions,
      readOnly,
      schemaPath,
    },
    uuid: uuidFromContext,
  } = useEditorConfigContext()
  const { getFormState } = useServerFunctions()
  const editDepth = useEditDepth()

  const [initialState, setInitialState] = React.useState<false | FormState | undefined>(
    initialLexicalFormState?.[formData.id]?.formState,
  )

  const [CustomLabel, setCustomLabel] = React.useState<React.ReactNode | undefined>(
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    initialState?.['_components']?.customComponents?.BlockLabel,
  )

  const [CustomBlock, setCustomBlock] = React.useState<React.ReactNode | undefined>(
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    initialState?.['_components']?.customComponents?.Block,
  )

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-inlineBlocks-create-${uuidFromContext}-${formData.id}`,
    depth: editDepth,
  })
  const { toggleDrawer } = useLexicalDrawer(drawerSlug, true)

  const inlineBlockElemElemRef = useRef<HTMLDivElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()

  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${formData.blockType}`

  const clientSchemaMap = featureClientSchemaMap['blocks']

  const blocksField: BlocksFieldClient = clientSchemaMap[
    componentMapRenderedBlockPath
  ][0] as BlocksFieldClient

  const clientBlock = blocksField.blocks[0]

  const removeInlineBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  }, [editor, nodeKey])

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      const deleteSelection = $getSelection()
      if (isSelected && $isNodeSelection(deleteSelection)) {
        event.preventDefault()
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isInlineBlockNode(node)) {
              node.remove()
            }
          })
        })
      }
      return false
    },
    [editor, isSelected],
  )
  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload
      // Check if inlineBlockElemElemRef.target or anything WITHIN inlineBlockElemElemRef.target was clicked
      if (
        event.target === inlineBlockElemElemRef.current ||
        inlineBlockElemElemRef.current?.contains(event.target as Node)
      ) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          if (!isSelected) {
            clearSelection()
            setSelected(true)
          }
        }
        return true
      }

      return false
    },
    [isSelected, setSelected, clearSelection],
  )

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<MouseEvent>(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),

      editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW),
    )
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected, onClick])

  const blockDisplayName = clientBlock?.labels?.singular
    ? getTranslation(clientBlock.labels.singular, i18n)
    : clientBlock?.slug

  const onChangeAbortControllerRef = useRef(new AbortController())
  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${clientBlock?.slug}.fields`

  // Initial state for newly created blocks
  useEffect(() => {
    const abortController = new AbortController()

    const awaitInitialState = async () => {
      /*
       * This will only run if a new block is created. For all existing blocks that are loaded when the document is loaded, or when the form is saved,
       * this is not run, as the lexical field RSC will fetch the state server-side and pass it to the client. That way, we avoid unnecessary client-side
       * requests. Though for newly created blocks, we need to fetch the state client-side, as the server doesn't know about the block yet.
       */
      const { state } = await getFormState({
        id,
        collectionSlug,
        data: formData,
        docPermissions: { fields: true },
        docPreferences: await getDocPreferences(),
        globalSlug,
        operation: 'update',
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      if (state) {
        setInitialState(state)
        setCustomLabel(state['_components']?.customComponents?.BlockLabel)
        setCustomBlock(state['_components']?.customComponents?.Block)
      }
    }

    if (formData && !initialState) {
      void awaitInitialState()
    }

    return () => {
      abortAndIgnore(abortController)
    }
  }, [
    getFormState,
    schemaFieldsPath,
    id,
    formData,
    initialState,
    collectionSlug,
    globalSlug,
    getDocPreferences,
  ])

  /**
   * HANDLE ONCHANGE
   */
  const onChange = useCallback(
    async ({ formState: prevFormState, submit }: { formState: FormState; submit?: boolean }) => {
      abortAndIgnore(onChangeAbortControllerRef.current)

      const controller = new AbortController()
      onChangeAbortControllerRef.current = controller

      const { state } = await getFormState({
        id,
        collectionSlug,
        docPermissions: {
          fields: true,
        },
        docPreferences: await getDocPreferences(),
        formState: prevFormState,
        globalSlug,
        operation: 'update',
        renderAllFields: submit ? true : false,
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      if (!state) {
        return prevFormState
      }

      if (submit) {
        setCustomLabel(state['_components']?.customComponents?.BlockLabel)
        setCustomBlock(state['_components']?.customComponents?.Block)
      }

      return state
    },
    [getFormState, id, collectionSlug, getDocPreferences, globalSlug, schemaFieldsPath],
  )
  // cleanup effect
  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current)
    }
  }, [])

  /**
   * HANDLE FORM SUBMIT
   */
  const onFormSubmit = useCallback(
    (formState: FormState) => {
      const newData: any = reduceFieldsToValues(formState)
      newData.blockType = formData.blockType
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isInlineBlockNode(node)) {
          node.setFields(newData)
        }
      })
    },
    [editor, nodeKey, formData],
  )

  const RemoveButton = useMemo(
    () => () => (
      <Button
        buttonStyle="icon-label"
        className={`${baseClass}__removeButton`}
        disabled={readOnly}
        icon="x"
        onClick={(e) => {
          e.preventDefault()
          removeInlineBlock()
        }}
        round
        size="small"
        tooltip={t('lexical:blocks:inlineBlocks:remove', { label: blockDisplayName })}
      />
    ),
    [blockDisplayName, readOnly, removeInlineBlock, t],
  )

  const EditButton = useMemo(
    () => () => (
      <Button
        buttonStyle="icon-label"
        className={`${baseClass}__editButton`}
        disabled={readOnly}
        el="button"
        icon="edit"
        onClick={() => {
          toggleDrawer()
        }}
        round
        size="small"
        tooltip={t('lexical:blocks:inlineBlocks:edit', { label: blockDisplayName })}
      />
    ),
    [blockDisplayName, readOnly, t, toggleDrawer],
  )

  const InlineBlockContainer = useMemo(
    () =>
      ({ children }: { children: React.ReactNode }) => (
        <div
          className={[
            baseClass,
            baseClass + '-' + formData.blockType,
            isSelected && `${baseClass}--selected`,
          ]
            .filter(Boolean)
            .join(' ')}
          ref={inlineBlockElemElemRef}
        >
          {children}
        </div>
      ),
    [formData.blockType, isSelected],
  )

  const Label = useMemo(() => {
    if (CustomLabel) {
      return () => CustomLabel
    } else {
      return () => <div>{getTranslation(clientBlock.labels!.singular, i18n)}</div>
    }
  }, [CustomLabel, clientBlock.labels, i18n])

  return (
    <Form
      beforeSubmit={[
        async ({ formState }) => {
          // This is only called when form is submitted from drawer
          return await onChange({ formState, submit: true })
        },
      ]}
      disableValidationOnSubmit
      fields={clientBlock.fields}
      initialState={initialState || {}}
      onChange={[onChange]}
      onSubmit={(formState) => {
        onFormSubmit(formState)
        toggleDrawer()
      }}
      uuid={uuid()}
    >
      <EditDepthProvider>
        <Drawer
          className={''}
          slug={drawerSlug}
          title={t(`lexical:blocks:inlineBlocks:${formData?.id ? 'edit' : 'create'}`, {
            label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label'),
          })}
        >
          {initialState ? (
            <>
              <RenderFields
                fields={clientBlock.fields}
                forceRender
                parentIndexPath=""
                parentPath="" // See Blocks feature path for details as for why this is empty
                parentSchemaPath={schemaFieldsPath}
                permissions={permissions}
                readOnly={false}
              />
              <FormSubmit programmaticSubmit={true}>{t('fields:saveChanges')}</FormSubmit>
            </>
          ) : null}
        </Drawer>
      </EditDepthProvider>
      {CustomBlock ? (
        <InlineBlockComponentContext.Provider
          value={{
            EditButton,
            initialState,
            InlineBlockContainer,
            Label,
            nodeKey,
            RemoveButton,
          }}
        >
          {CustomBlock}
        </InlineBlockComponentContext.Provider>
      ) : (
        <InlineBlockContainer>
          {initialState ? <Label /> : <ShimmerEffect height="15px" width="40px" />}
          {editor.isEditable() ? (
            <div className={`${baseClass}__actions`}>
              <EditButton />
              <RemoveButton />
            </div>
          ) : null}
        </InlineBlockContainer>
      )}
    </Form>
  )
}
