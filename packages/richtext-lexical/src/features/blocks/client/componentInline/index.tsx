'use client'

import type { BlocksFieldClient, ClientBlock, Data, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
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
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react'
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
  readonly className: string
  /**
   * Directly pass a custom block component to be rendered instead of the default one.
   * This will have priority over the custom block component passed in the field's config.
   */
  readonly CustomBlock?: React.ReactNode
  /**
   * Directly pass a custom label component to be rendered instead of the default one.
   * This will have priority over the custom label component passed in the field's config.
   */
  readonly CustomLabel?: React.ReactNode
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
  const {
    cacheBuster,
    className: baseClass,
    CustomBlock: CustomBlockFromProps,
    CustomLabel: CustomLabelFromProps,
    formData,
    nodeKey,
  } = props

  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const { i18n, t } = useTranslation<object, string>()
  const {
    createdInlineBlock,
    fieldProps: { featureClientSchemaMap, initialLexicalFormState, schemaPath },
    setCreatedInlineBlock,
    uuid: uuidFromContext,
  } = useEditorConfigContext()
  const { fields: parentDocumentFields } = useDocumentForm()

  const { getFormState } = useServerFunctions()
  const editDepth = useEditDepth()
  const firstTimeDrawer = useRef(false)

  const [initialState, setInitialState] = React.useState<false | FormState | undefined>(() => {
    // Initial form state that was calculated server-side. May have stale values
    const cachedFormState = initialLexicalFormState?.[formData.id]?.formState
    if (!cachedFormState) {
      return false
    }

    // Merge current formData values into the cached form state
    // This ensures that when the component remounts (e.g., due to view changes), we don't lose user edits
    return Object.fromEntries(
      Object.entries(cachedFormState).map(([fieldName, fieldState]) => [
        fieldName,
        fieldName in formData
          ? {
              ...fieldState,
              initialValue: formData[fieldName],
              value: formData[fieldName],
            }
          : fieldState,
      ]),
    )
  })

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
    CustomLabelFromProps ??
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      initialState?.['_components']?.customComponents?.BlockLabel ??
      undefined,
  )

  const [CustomBlock, setCustomBlock] = React.useState<React.ReactNode | undefined>(
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    CustomBlockFromProps ?? initialState?.['_components']?.customComponents?.Block ?? undefined,
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
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
          excludeFiles: true,
        }),
        globalSlug,
        initialBlockData: formData,
        initialBlockFormState: formData,
        operation: 'update',
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      if (state) {
        const newFormStateData: InlineBlockFields = reduceFieldsToValues(
          deepCopyObjectSimpleWithoutReactComponents(state, { excludeFiles: true }),
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
        if (!CustomLabelFromProps) {
          setCustomLabel(state['_components']?.customComponents?.BlockLabel)
        }
        if (!CustomBlockFromProps) {
          setCustomBlock(state['_components']?.customComponents?.Block)
        }
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
    isEditable,
    CustomLabelFromProps,
    CustomBlockFromProps,
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
        documentFormState: deepCopyObjectSimpleWithoutReactComponents(parentDocumentFields, {
          excludeFiles: true,
        }),
        formState: prevFormState,
        globalSlug,
        initialBlockFormState: prevFormState,
        operation: 'update',
        readOnly: !isEditable,
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
      isEditable,
      schemaFieldsPath,
    ],
  )
  // cleanup effect
  useEffect(() => {
    const isStateOutOfSync = (formData: InlineBlockFields, initialState: FormState) => {
      return Object.keys(initialState).some(
        (key) => initialState[key] && formData[key] !== initialState[key].value,
      )
    }

    return () => {
      // If the component is unmounted (either via removeInlineBlock or via lexical itself) and the form state got changed before,
      // we need to reset the initial state to force a re-fetch of the initial state when it gets mounted again (e.g. via lexical history undo).
      // Otherwise it would use an outdated initial state.
      if (initialState && isStateOutOfSync(formData, initialState)) {
        setInitialState(false)
      }
      abortAndIgnore(onChangeAbortControllerRef.current)
    }
  }, [formData, initialState])

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
          className={[`${baseClass}__container`, baseClass + '-' + formData.blockType, className]
            .filter(Boolean)
            .join(' ')}
          ref={inlineBlockElemElemRef}
        >
          {children}
        </div>
      ),
    [baseClass, formData.blockType],
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
        {isEditable ? (
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
                readOnly={!isEditable}
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
          {isEditable ? (
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
