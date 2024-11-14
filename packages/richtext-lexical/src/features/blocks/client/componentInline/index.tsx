'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
const baseClass = 'inline-block'

import type { BlockAsFieldClient, FieldState, FormState } from 'payload'

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

import type { InlineBlockFields } from '../nodes/InlineBlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { $isInlineBlockNode } from '../nodes/InlineBlocksNode.js'

type Props = {
  readonly formData: InlineBlockFields
  readonly nodeKey: string
}

export const InlineBlockComponent: React.FC<Props> = (props) => {
  let { formData, nodeKey } = props
  const [editor] = useLexicalComposerContext()
  const { i18n, t } = useTranslation<object, string>()
  const {
    fieldProps: { featureClientSchemaMap, permissions, readOnly, schemaPath },
    uuid: uuidFromContext,
  } = useEditorConfigContext()
  const { getFormState } = useServerFunctions()
  const editDepth = useEditDepth()
  const [inlineBlockFormState, setInlineBlockFormState] = useState<FieldState | undefined>(
    undefined,
  )

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-inlineBlocks-create-` + uuidFromContext,
    depth: editDepth,
  })
  const { toggleDrawer } = useLexicalDrawer(drawerSlug, true)

  const inlineBlockElemElemRef = useRef<HTMLDivElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const { id, collectionSlug, docPermissions, getDocPreferences, globalSlug } = useDocumentInfo()

  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${formData.blockType}`

  const clientSchemaMap = featureClientSchemaMap['blocks']

  const clientBlock: BlockAsFieldClient = clientSchemaMap[
    componentMapRenderedBlockPath
  ] as BlockAsFieldClient

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
  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${clientBlock?.slug}`
  const [initialState, setInitialState] = useState<false | FormState | undefined>(false)

  /**
   * HANDLE INITIAL STATE
   */
  useEffect(() => {
    const controller = new AbortController()

    const awaitInitialState = async () => {
      const { state } = await getFormState({
        id,
        collectionSlug,
        data: {
          [clientBlock.slug]: formData,
        },
        docPermissions,
        docPreferences: await getDocPreferences(),
        globalSlug,
        operation: 'update',
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      const unwrappedState = {}

      for (const key in state) {
        if (key !== clientBlock.slug) {
          unwrappedState[key.replace(`${clientBlock?.slug}.`, '')] = state[key]
        } else {
          setInlineBlockFormState(state[key])
        }
      }

      setInitialState(unwrappedState)
    }

    void awaitInitialState()

    return () => {
      abortAndIgnore(controller)
    }
  }, [
    schemaFieldsPath,
    id,
    formData,
    getFormState,
    collectionSlug,
    globalSlug,
    docPermissions,
    getDocPreferences,
    clientBlock.slug,
  ])

  /**
   * HANDLE ONCHANGE
   */
  const onChange = useCallback(
    async ({ formState: prevFormState }) => {
      abortAndIgnore(onChangeAbortControllerRef.current)

      const controller = new AbortController()
      onChangeAbortControllerRef.current = controller

      const wrappedState = {}

      for (const key in prevFormState) {
        if (key !== clientBlock.slug) {
          wrappedState[`${clientBlock?.slug}.` + key] = prevFormState[key]
        }
      }

      const { state } = await getFormState({
        id,
        collectionSlug,
        docPermissions,
        docPreferences: await getDocPreferences(),
        formState: wrappedState,
        globalSlug,
        operation: 'update',
        schemaPath: schemaFieldsPath,
        signal: controller.signal,
      })

      if (!state) {
        return prevFormState
      }

      const unwrappedState = {}

      for (const key in state) {
        if (key !== clientBlock.slug) {
          unwrappedState[key.replace(`${clientBlock?.slug}.`, '')] = state[key]
        } else {
          setInlineBlockFormState(state[key])
        }
      }

      return unwrappedState
    },
    [
      getFormState,
      id,
      collectionSlug,
      docPermissions,
      getDocPreferences,
      globalSlug,
      schemaFieldsPath,
      clientBlock?.slug,
    ],
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
    (formState) => {
      const newData: any = reduceFieldsToValues(formState)
      newData.blockType = formData.blockType
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isInlineBlockNode(node)) {
          formData = newData
          node.setFields(newData)
        }
      })
    },
    [editor, nodeKey, formData],
  )
  if (!initialState || !inlineBlockFormState) {
    return <p>Loading...</p>
  }

  const Label = inlineBlockFormState?.customComponents?.BlockLabel
  return (
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
      <EditDepthProvider>
        <Drawer
          className={''}
          slug={drawerSlug}
          title={t(`lexical:blocks:inlineBlocks:${formData?.id ? 'edit' : 'create'}`, {
            label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label'),
          })}
        >
          <Form
            beforeSubmit={[onChange]}
            disableValidationOnSubmit
            fields={clientBlock.fields}
            initialState={initialState}
            onChange={[onChange]}
            onSubmit={(formState) => {
              onFormSubmit(formState)
              toggleDrawer()
            }}
            uuid={uuid()}
          >
            <RenderFields
              fields={clientBlock.fields}
              forceRender
              parentIndexPath=""
              parentPath="" // See Blocks feature path for details as for why this is empty
              parentSchemaPath={schemaFieldsPath}
              permissions={permissions}
              readOnly={false}
            />
            <FormSubmit>{t('fields:saveChanges')}</FormSubmit>
          </Form>
        </Drawer>
      </EditDepthProvider>
      {Label ? (
        Label.type === 'client' ? (
          <Label.Component formData={formData} />
        ) : (
          Label.Component
        )
      ) : (
        <div>{getTranslation(clientBlock.labels!.singular, i18n)}</div>
      )}
      {editor.isEditable() && (
        <div className={`${baseClass}__actions`}>
          <Button
            buttonStyle="icon-label"
            className={`${baseClass}__editButton`}
            disabled={readOnly}
            el="div"
            icon="edit"
            onClick={() => {
              toggleDrawer()
            }}
            round
            size="small"
            tooltip={t('lexical:blocks:inlineBlocks:edit', { label: blockDisplayName })}
          />
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
        </div>
      )}
    </div>
  )
}
