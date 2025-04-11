'use client'

import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react'
const baseClass = 'inline-block'

import type { BlocksFieldClient, ClientBlock, Data, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
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
  useConfig,
  useDocumentForm,
  useDocumentInfo,
  useEditDepth,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import { $getNodeByKey } from 'lexical'

import './index.scss'

import { deepCopyObjectSimpleWithoutReactComponents, reduceFieldsToValues } from 'payload/shared'
import { v4 as uuid } from 'uuid'

import type { InlineBlockFields } from '../../server/nodes/InlineBlocksNode.js'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { $isInlineBlockNode } from '../nodes/InlineBlocksNode.js'

type Props = {
  /**
   * Can be modified by the node in order to trigger the re-fetch of the initial state based on the
   * formData. This is useful when node.setFields() is explicitly called from outside of the form - in
   * this case, the new field state is likely not reflected in the form state, so we need to re-fetch
   */
  readonly cacheBuster: number
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

export const useInlineBlockComponentContext = () => React.use(InlineBlockComponentContext)

export const InlineBlockComponent: React.FC<Props> = (props) => {
  const { cacheBuster, formData, nodeKey } = props

  const [editor] = useLexicalComposerContext()
  const { i18n, t } = useTranslation<object, string>()
  const {
    createdInlineBlock,
    fieldProps: {
      featureClientSchemaMap,
      initialLexicalFormState,
      permissions,
      readOnly,
      schemaPath,
    },
    setCreatedInlineBlock,
    uuid: uuidFromContext,
  } = useEditorConfigContext()
  const { fields: parentDocumentFields } = useDocumentForm()

  const { getFormState } = useServerFunctions()
  const editDepth = useEditDepth()
  const firstTimeDrawer = useRef(false)

  const [initialState, setInitialState] = React.useState<false | FormState | undefined>(
    () => initialLexicalFormState?.[formData.id]?.formState,
  )

  const hasMounted = useRef(false)
  const prevCacheBuster = useRef(cacheBuster)
  useEffect(() => {
    if (hasMounted.current) {
      if (prevCacheBuster.current !== cacheBuster) {
        setInitialState(false)
      }
      prevCacheBuster.current = cacheBuster
    } else {
      hasMounted.current = true
    }
  }, [cacheBuster])

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
  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()
  const { config } = useConfig()

  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${formData.blockType}`

  const clientSchemaMap = featureClientSchemaMap['blocks']

  const blocksField: BlocksFieldClient = clientSchemaMap?.[
    componentMapRenderedBlockPath
  ]?.[0] as BlocksFieldClient

  const clientBlock: ClientBlock | undefined = blocksField.blockReferences
    ? typeof blocksField?.blockReferences?.[0] === 'string'
      ? config.blocksMap[blocksField?.blockReferences?.[0]]
      : blocksField?.blockReferences?.[0]
    : blocksField?.blocks?.[0]

  const clientBlockFields = clientBlock?.fields ?? []

  // Open drawer on "mount"
  useEffect(() => {
    if (!firstTimeDrawer.current && createdInlineBlock?.getKey() === nodeKey) {
      // > 2 because they always have "id" and "blockName" fields
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
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields),
        globalSlug,
        initialBlockData: formData,
        initialBlockFormState: formData,
        operation: 'update',
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      if (state) {
        const newFormStateData: InlineBlockFields = reduceFieldsToValues(
          deepCopyObjectSimpleWithoutReactComponents(state),
          true,
        ) as InlineBlockFields

        // Things like default values may come back from the server => update the node with the new data
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if (node && $isInlineBlockNode(node)) {
            const newData = newFormStateData
            newData.blockType = formData.blockType

            node.setFields(newData, true)
          }
        })

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
    editor,
    nodeKey,
    schemaFieldsPath,
    id,
    formData,
    initialState,
    collectionSlug,
    globalSlug,
    getDocPreferences,
    parentDocumentFields,
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
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields),
        formState: prevFormState,
        globalSlug,
        initialBlockFormState: prevFormState,
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
    [
      getFormState,
      id,
      collectionSlug,
      getDocPreferences,
      parentDocumentFields,
      globalSlug,
      schemaFieldsPath,
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
    (formState: FormState, newData: Data) => {
      newData.blockType = formData.blockType

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isInlineBlockNode(node)) {
          node.setFields(newData as InlineBlockFields, true)
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
      ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div
          className={[baseClass, baseClass + '-' + formData.blockType, className]
            .filter(Boolean)
            .join(' ')}
          ref={inlineBlockElemElemRef}
        >
          {children}
        </div>
      ),
    [formData.blockType],
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

  if (!clientBlock) {
    return (
      <InlineBlockContainer className={`${baseClass}-not-found`}>
        <span>Error: Block '{formData.blockType}' not found</span>
        {editor.isEditable() ? (
          <div className={`${baseClass}__actions`}>
            <RemoveButton />
          </div>
        ) : null}
      </InlineBlockContainer>
    )
  }

  return (
    <Form
      beforeSubmit={[
        async ({ formState }) => {
          // This is only called when form is submitted from drawer
          return await onChange({ formState, submit: true })
        },
      ]}
      disableValidationOnSubmit
      el="div"
      fields={clientBlock?.fields}
      initialState={initialState || {}}
      onChange={[onChange]}
      onSubmit={(formState, data) => {
        onFormSubmit(formState, data)
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
                fields={clientBlock?.fields}
                forceRender
                parentIndexPath=""
                parentPath="" // See Blocks feature path for details as for why this is empty
                parentSchemaPath={schemaFieldsPath}
                permissions={true}
                readOnly={false}
              />
              <FormSubmit programmaticSubmit={true}>{t('fields:saveChanges')}</FormSubmit>
            </>
          ) : null}
        </Drawer>
      </EditDepthProvider>
      {CustomBlock ? (
        <InlineBlockComponentContext
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
        </InlineBlockComponentContext>
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
