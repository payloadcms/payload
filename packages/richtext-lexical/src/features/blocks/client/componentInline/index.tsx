'use client'

import type { BlocksFieldClient, ClientBlock, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { getTranslation } from '@payloadcms/translations'

import './index.scss'

import {
  Button,
  Drawer,
  EditDepthProvider,
  formatDrawerSlug,
  ShimmerEffect,
  useConfig,
  useEditDepth,
  useForm,
  useFormFields,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { RenderLexicalFields } from '../../../../utilities/RenderLexicalFields.js'

type Props = {
  readonly blockType: string
  readonly className: string
  readonly id: string
  readonly nodeKey: string
}

type InlineBlockComponentContextType = {
  EditButton?: React.FC
  InlineBlockContainer?: React.FC<{ children: React.ReactNode }>
  Label?: React.FC
  nodeKey?: string
  parentPath?: string
  parentSchemaPath?: string
  RemoveButton?: React.FC
}

const InlineBlockComponentContext = createContext<InlineBlockComponentContextType>({})

export const useInlineBlockComponentContext = () => React.use(InlineBlockComponentContext)

export const InlineBlockComponent: React.FC<Props> = (props) => {
  const { id, blockType, className: baseClass, nodeKey } = props

  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const { i18n, t } = useTranslation<object, string>()
  const {
    createdInlineBlock,
    fieldProps: { featureClientSchemaMap, path, schemaPath },
    setCreatedInlineBlock,
    uuid: uuidFromContext,
  } = useEditorConfigContext()

  const editDepth = useEditDepth()
  const firstTimeDrawer = useRef(false)

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-inlineBlocks-create-${uuidFromContext}-${id}`,
    depth: editDepth,
  })
  const { toggleDrawer } = useLexicalDrawer(drawerSlug, true)
  const { closeModal } = useModal()
  const { dispatchFields } = useForm()

  const inlineBlockElemElemRef = useRef<HTMLDivElement | null>(null)
  const { config } = useConfig()

  const blockSchemaPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${blockType}`
  const blockFieldsSchemaPath = `${blockSchemaPath}.fields`
  const blockFieldsPath = `${path}.${id}`

  const blocksField: BlocksFieldClient | undefined = featureClientSchemaMap?.blocks?.[
    blockSchemaPath
  ]?.[0] as BlocksFieldClient | undefined

  const clientBlock: ClientBlock | undefined = blocksField?.blockReferences
    ? typeof blocksField?.blockReferences?.[0] === 'string'
      ? config.blocksMap[blocksField?.blockReferences?.[0]]
      : blocksField?.blockReferences?.[0]
    : blocksField?.blocks?.[0]

  const clientBlockFields = clientBlock?.fields ?? []

  const blockFormState: FormState = useFormFields(([fields]) => {
    const data: FormState = {}
    const prefix = `${blockFieldsPath}.`
    for (const [key, value] of Object.entries(fields)) {
      if (key.startsWith(prefix)) {
        data[key.slice(prefix.length)] = value
      }
    }
    return data
  })

  const isLoading = Object.keys(blockFormState).length === 0

  const CustomLabel = blockFormState?.['_components']?.customComponents?.BlockLabel
  const CustomBlock = blockFormState?.['_components']?.customComponents?.Block

  useEffect(() => {
    if (!firstTimeDrawer.current && createdInlineBlock?.getKey() === nodeKey) {
      if (clientBlockFields.length > 2) {
        toggleDrawer()
      }
      setCreatedInlineBlock?.(undefined)
      firstTimeDrawer.current = true
    }
  }, [clientBlockFields.length, createdInlineBlock, nodeKey, setCreatedInlineBlock, toggleDrawer])

  const removeInlineBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  }, [editor, nodeKey])

  const blockDisplayName = clientBlock?.labels?.singular
    ? getTranslation(clientBlock?.labels.singular, i18n)
    : clientBlock?.slug

  const RemoveButton = useMemo(
    () => () => (
      <Button
        buttonStyle="icon-label"
        className={`${baseClass}__removeButton`}
        disabled={!isEditable}
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
    [baseClass, blockDisplayName, isEditable, removeInlineBlock, t],
  )

  const EditButton = useMemo(
    () => () => (
      <Button
        buttonStyle="icon-label"
        className={`${baseClass}__editButton`}
        disabled={!isEditable}
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
    [baseClass, blockDisplayName, isEditable, t, toggleDrawer],
  )

  const InlineBlockContainer = useMemo(
    () =>
      ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div
          className={[`${baseClass}__container`, baseClass + '-' + blockType, className]
            .filter(Boolean)
            .join(' ')}
          ref={inlineBlockElemElemRef}
        >
          {children}
        </div>
      ),
    [baseClass, blockType],
  )

  const Label = useMemo(() => {
    if (CustomLabel) {
      return () => CustomLabel
    } else {
      return () => (
        <div>{clientBlock?.labels ? getTranslation(clientBlock?.labels.singular, i18n) : ''}</div>
      )
    }
  }, [CustomLabel, clientBlock?.labels, i18n])

  const handleDrawerSave = useCallback(() => {
    const componentsState = blockFormState['_components']
    if (componentsState) {
      dispatchFields({
        type: 'UPDATE_MANY',
        formState: {
          [`${blockFieldsPath}._components`]: {
            ...componentsState,
            lastRenderedPath: undefined,
          },
        },
      })
    }
    closeModal(drawerSlug)
  }, [blockFormState, blockFieldsPath, closeModal, dispatchFields, drawerSlug])

  if (!clientBlock) {
    return (
      <InlineBlockContainer className={`${baseClass}-not-found`}>
        <span>Error: Block '{blockType}' not found</span>
        {isEditable ? (
          <div className={`${baseClass}__actions`}>
            <RemoveButton />
          </div>
        ) : null}
      </InlineBlockContainer>
    )
  }

  if (isLoading) {
    return (
      <InlineBlockContainer>
        <ShimmerEffect height="1rem" width="4rem" />
      </InlineBlockContainer>
    )
  }

  return (
    <>
      <EditDepthProvider>
        <Drawer
          slug={drawerSlug}
          title={t(`lexical:blocks:inlineBlocks:${id ? 'edit' : 'create'}`, {
            label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label'),
          })}
        >
          <RenderLexicalFields
            fields={clientBlock?.fields}
            forceRender
            nodeKey={nodeKey}
            parentIndexPath=""
            parentPath={blockFieldsPath}
            parentSchemaPath={blockFieldsSchemaPath}
            permissions={true}
            readOnly={!isEditable}
          />
          <Button onClick={handleDrawerSave}>{t('fields:saveChanges')}</Button>
        </Drawer>
      </EditDepthProvider>
      <InlineBlockComponentContext
        value={{
          EditButton,
          InlineBlockContainer,
          Label,
          nodeKey,
          parentPath: blockFieldsPath,
          parentSchemaPath: blockFieldsSchemaPath,
          RemoveButton,
        }}
      >
        {CustomBlock ? (
          CustomBlock
        ) : (
          <InlineBlockContainer>
            <Label />
            {isEditable ? (
              <div className={`${baseClass}__actions`}>
                <EditButton />
                <RemoveButton />
              </div>
            ) : null}
          </InlineBlockContainer>
        )}
      </InlineBlockComponentContext>
    </>
  )
}
