'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  Collapsible,
  Drawer,
  EditDepthProvider,
  ErrorPill,
  Form,
  formatDrawerSlug,
  FormSubmit,
  Pill,
  RenderFields,
  SectionTitle,
  useConfig,
  useDocumentForm,
  useDocumentInfo,
  useEditDepth,
  useFormSubmitted,
  useServerFunctions,
  useTranslation,
} from '@payloadcms/ui'
import { abortAndIgnore } from '@payloadcms/ui/shared'
import { $getNodeByKey } from 'lexical'
import {
  type BlocksFieldClient,
  type ClientBlock,
  type CollapsedPreferences,
  type FormState,
} from 'payload'
import { deepCopyObjectSimpleWithoutReactComponents, reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { v4 as uuid } from 'uuid'

import type { ViewMapBlockComponentProps } from '../../../../types.js'
import type { BlockFields } from '../../server/nodes/BlocksNode.js'

import './index.scss'
import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { $isBlockNode } from '../nodes/BlocksNode.js'
import {
  type BlockCollapsibleWithErrorProps,
  BlockContent,
  useBlockComponentContext,
} from './BlockContent.js'
import { removeEmptyArrayValues } from './removeEmptyArrayValues.js'

export type BlockComponentProps<TFormData extends Record<string, unknown> = BlockFields> = {
  /**
   * Can be modified by the node in order to trigger the re-fetch of the initial state based on the
   * formData. This is useful when node.setFields() is explicitly called from outside of the form - in
   * this case, the new field state is likely not reflected in the form state, so we need to re-fetch
   */
  readonly cacheBuster: number
  readonly className: string
  /**
   * Custom block component from view map
   * Will be rendered with useBlockComponentContext hook.
   */
  readonly CustomBlock?: React.FC<ViewMapBlockComponentProps>
  /**
   * Custom block label from view map
   * Will be rendered with useBlockComponentContext hook.
   */
  readonly CustomLabel?: React.FC<ViewMapBlockComponentProps>
  /**
   * The block's form data (field values).
   */
  readonly formData: TFormData
  /**
   * The unique key identifying this block node in the current editor instance.
   */
  readonly nodeKey: string
}

export const BlockComponent: React.FC<BlockComponentProps> = (props) => {
  const {
    cacheBuster,
    className: baseClass,
    CustomBlock: CustomBlockFromProps,
    CustomLabel: CustomLabelFromProps,
    formData,
    nodeKey,
  } = props

  const submitted = useFormSubmitted()
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const {
    fieldProps: {
      featureClientSchemaMap,
      field: parentLexicalRichTextField,
      initialLexicalFormState,
      schemaPath,
    },
    uuid: uuidFromContext,
  } = useEditorConfigContext()

  const { fields: parentDocumentFields } = useDocumentForm()
  const onChangeAbortControllerRef = useRef(new AbortController())
  const editDepth = useEditDepth()
  const [errorCount, setErrorCount] = React.useState(0)

  const { config } = useConfig()

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-blocks-create-${uuidFromContext}-${formData.id}`,
    depth: editDepth,
  })
  const { toggleDrawer } = useLexicalDrawer(drawerSlug)

  // Used for saving collapsed to preferences (and gettin' it from there again)
  // Remember, these preferences are scoped to the whole document, not just this form. This
  // is important to consider for the data path used in setDocFieldPreferences
  const { getDocPreferences, setDocFieldPreferences } = useDocumentInfo()
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()

  const blockType = formData.blockType

  const { getFormState } = useServerFunctions()
  const schemaFieldsPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockType}.fields`

  const [initialState, setInitialState] = React.useState<false | FormState | undefined>(() => {
    // Initial form state that was calculated server-side. May have stale values
    const cachedFormState = initialLexicalFormState?.[formData.id]?.formState
    if (!cachedFormState) {
      return false
    }

    // Merge current formData values into the cached form state
    // This ensures that when the component remounts (e.g., due to view changes), we don't lose user edits
    const mergedState = Object.fromEntries(
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

    // Manually add blockName, as it's not part of cachedFormState
    mergedState.blockName = {
      initialValue: formData.blockName,
      passesCondition: true,
      valid: true,
      value: formData.blockName,
    }

    return mergedState
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

  const [CustomLabel, setCustomLabel] = React.useState<React.ReactNode | undefined>(() => {
    if (CustomLabelFromProps) {
      return (
        <CustomLabelFromProps
          className={baseClass}
          formData={formData}
          isEditor={true}
          isJSXConverter={false}
          nodeKey={nodeKey}
          useBlockComponentContext={useBlockComponentContext}
        />
      )
    }
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return initialState?.['_components']?.customComponents?.BlockLabel ?? undefined
  })

  const [CustomBlock, setCustomBlock] = React.useState<React.ReactNode | undefined>(() => {
    if (CustomBlockFromProps) {
      return (
        <CustomBlockFromProps
          className={baseClass}
          formData={formData}
          isEditor={true}
          isJSXConverter={false}
          nodeKey={nodeKey}
          useBlockComponentContext={useBlockComponentContext}
        />
      )
    }
    // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
    return initialState?.['_components']?.customComponents?.Block ?? undefined
  })

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
        operation: 'update',
        readOnly: !isEditable,
        renderAllFields: true,
        schemaPath: schemaFieldsPath,
        signal: abortController.signal,
      })

      if (state) {
        state.blockName = {
          initialValue: formData.blockName,
          passesCondition: true,
          valid: true,
          value: formData.blockName,
        }

        const newFormStateData: BlockFields = reduceFieldsToValues(
          deepCopyObjectSimpleWithoutReactComponents(state, { excludeFiles: true }),
          true,
        ) as BlockFields

        // Things like default values may come back from the server => update the node with the new data
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if (node && $isBlockNode(node)) {
            const newData = newFormStateData
            newData.blockType = blockType

            node.setFields(newData, true)
          }
        })

        setInitialState(state)
        if (!CustomLabelFromProps) {
          setCustomLabel(state._components?.customComponents?.BlockLabel ?? undefined)
        }
        if (!CustomBlockFromProps) {
          setCustomBlock(state._components?.customComponents?.Block ?? undefined)
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
    schemaFieldsPath,
    isEditable,
    id,
    CustomLabelFromProps,
    CustomBlockFromProps,
    formData,
    editor,
    nodeKey,
    initialState,
    collectionSlug,
    globalSlug,
    getDocPreferences,
    parentDocumentFields,
    blockType,
  ])

  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(
    initialLexicalFormState?.[formData.id]?.collapsed ?? false,
  )

  const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockType}`

  const clientSchemaMap = featureClientSchemaMap['blocks']

  const blocksField: BlocksFieldClient | undefined = clientSchemaMap?.[
    componentMapRenderedBlockPath
  ]?.[0] as BlocksFieldClient

  const clientBlock: ClientBlock | undefined = blocksField.blockReferences
    ? typeof blocksField?.blockReferences?.[0] === 'string'
      ? config.blocksMap[blocksField?.blockReferences?.[0]]
      : blocksField?.blockReferences?.[0]
    : blocksField?.blocks?.[0]

  const { i18n, t } = useTranslation<object, string>()

  const onChange = useCallback(
    async ({ formState: prevFormState, submit }: { formState: FormState; submit?: boolean }) => {
      abortAndIgnore(onChangeAbortControllerRef.current)

      const controller = new AbortController()
      onChangeAbortControllerRef.current = controller

      const { state: newFormState } = await getFormState({
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

      if (!newFormState) {
        return prevFormState
      }

      if (prevFormState.blockName) {
        newFormState.blockName = prevFormState.blockName
      }

      const newFormStateData: BlockFields = reduceFieldsToValues(
        removeEmptyArrayValues({
          fields: deepCopyObjectSimpleWithoutReactComponents(newFormState, { excludeFiles: true }),
        }),
        true,
      ) as BlockFields

      setTimeout(() => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey)
          if (node && $isBlockNode(node)) {
            const newData = newFormStateData
            newData.blockType = blockType
            node.setFields(newData, true)
          }
        })
      }, 0)

      if (submit) {
        setCustomLabel(newFormState._components?.customComponents?.BlockLabel ?? undefined)
        setCustomBlock(newFormState._components?.customComponents?.Block ?? undefined)

        let rowErrorCount = 0
        for (const formField of Object.values(newFormState)) {
          if (formField?.valid === false) {
            rowErrorCount++
          }
        }
        setErrorCount(rowErrorCount)
      }

      return newFormState
    },

    [
      getFormState,
      id,
      collectionSlug,
      getDocPreferences,
      globalSlug,
      schemaFieldsPath,
      blockType,
      parentDocumentFields,
      isEditable,
      editor,
      nodeKey,
    ],
  )

  useEffect(() => {
    return () => {
      abortAndIgnore(onChangeAbortControllerRef.current)
    }
  }, [])

  const removeBlock = useCallback(() => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  }, [editor, nodeKey])

  const blockDisplayName = clientBlock?.labels?.singular
    ? getTranslation(clientBlock.labels.singular, i18n)
    : clientBlock?.slug

  const onCollapsedChange = useCallback(
    (changedCollapsed: boolean) => {
      void getDocPreferences().then((currentDocPreferences) => {
        const currentFieldPreferences =
          currentDocPreferences?.fields?.[parentLexicalRichTextField.name]

        const collapsedArray = currentFieldPreferences?.collapsed

        const newCollapsed: CollapsedPreferences =
          collapsedArray && collapsedArray?.length ? collapsedArray : []

        if (changedCollapsed) {
          if (!newCollapsed.includes(formData.id)) {
            newCollapsed.push(formData.id)
          }
        } else {
          if (newCollapsed.includes(formData.id)) {
            newCollapsed.splice(newCollapsed.indexOf(formData.id), 1)
          }
        }

        setDocFieldPreferences(parentLexicalRichTextField.name, {
          collapsed: newCollapsed,
          hello: 'hi',
        })
      })
    },
    [getDocPreferences, parentLexicalRichTextField.name, setDocFieldPreferences, formData.id],
  )

  const EditButton = useMemo(
    () => () => (
      <Button
        buttonStyle="icon-label"
        className={`${baseClass}__editButton`}
        disabled={!isEditable}
        el="button"
        icon="edit"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleDrawer()
          return false
        }}
        onMouseDown={(e) => {
          // Needed to preserve lexical selection for toggleDrawer lexical selection restore.
          // I believe this is needed due to this button (usually) being inside of a collapsible.
          e.preventDefault()
        }}
        round
        size="small"
        tooltip={t('lexical:blocks:inlineBlocks:edit', { label: blockDisplayName })}
      />
    ),
    [baseClass, isEditable, t, blockDisplayName, toggleDrawer],
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
          removeBlock()
        }}
        round
        tooltip="Remove Block"
      />
    ),
    [baseClass, isEditable, removeBlock],
  )

  const BlockCollapsible = useMemo(
    () =>
      ({
        Actions,
        children,
        className,
        collapsibleProps,
        disableBlockName,
        editButton,
        errorCount,
        fieldHasErrors,
        Label,
        Pill: CustomPill,
        removeButton,
      }: BlockCollapsibleWithErrorProps) => {
        return (
          <div className={`${baseClass}__container ${baseClass}-${blockType}`}>
            <Collapsible
              className={[
                `${baseClass}__row`,
                fieldHasErrors ? `${baseClass}__row--has-errors` : `${baseClass}__row--no-errors`,
                className,
              ]
                .filter(Boolean)
                .join(' ')}
              collapsibleStyle={fieldHasErrors ? 'error' : 'default'}
              header={
                <div className={`${baseClass}__block-header`}>
                  {typeof Label !== 'undefined' ? (
                    Label
                  ) : typeof CustomLabel !== 'undefined' ? (
                    CustomLabel
                  ) : (
                    <div className={`${baseClass}__block-label`}>
                      {typeof CustomPill !== 'undefined' ? (
                        CustomPill
                      ) : (
                        <Pill
                          className={`${baseClass}__block-pill ${baseClass}__block-pill-${blockType}`}
                          pillStyle="white"
                          size="small"
                        >
                          {blockDisplayName ?? blockType}
                        </Pill>
                      )}
                      {!disableBlockName && !clientBlock?.admin?.disableBlockName && (
                        <SectionTitle path="blockName" readOnly={!isEditable} />
                      )}

                      {fieldHasErrors && (
                        <ErrorPill count={errorCount ?? 0} i18n={i18n} withMessage />
                      )}
                    </div>
                  )}

                  <div className={`${baseClass}__block-actions`}>
                    {typeof Actions !== 'undefined' ? (
                      Actions
                    ) : (
                      <>
                        {(CustomBlock && editButton !== false) || (!CustomBlock && editButton) ? (
                          <EditButton />
                        ) : null}
                        {removeButton !== false && isEditable ? <RemoveButton /> : null}
                      </>
                    )}
                  </div>
                </div>
              }
              isCollapsed={isCollapsed}
              key={0}
              onToggle={(incomingCollapsedState) => {
                onCollapsedChange(incomingCollapsedState)
                setIsCollapsed(incomingCollapsedState)
              }}
              {...(collapsibleProps || {})}
            >
              {children}
            </Collapsible>
          </div>
        )
      },
    [
      CustomBlock,
      CustomLabel,
      EditButton,
      RemoveButton,
      blockDisplayName,
      baseClass,
      clientBlock?.admin?.disableBlockName,
      blockType,
      i18n,
      isCollapsed,
      onCollapsedChange,
      isEditable,
    ],
  )

  const blockID = formData?.id

  const BlockDrawer = useMemo(
    () => () => (
      <EditDepthProvider>
        <Drawer
          className={''}
          slug={drawerSlug}
          title={t(`lexical:blocks:inlineBlocks:${blockID ? 'edit' : 'create'}`, {
            label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label'),
          })}
        >
          {initialState ? (
            <>
              <RenderFields
                fields={clientBlock?.fields ?? []}
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
    ),
    [
      initialState,
      drawerSlug,
      blockID,
      blockDisplayName,
      t,
      isEditable,
      clientBlock?.fields,
      schemaFieldsPath,
      // DO NOT ADD FORMDATA HERE! Adding formData will kick you out of sub block editors while writing.
    ],
  )

  // Memoized Form JSX
  const Block = useMemo(() => {
    if (!initialState) {
      return null
    }
    return (
      <Form
        beforeSubmit={[
          async ({ formState }) => {
            // This is only called when form is submitted from drawer - usually only the case if the block has a custom Block component
            return await onChange({ formState, submit: true })
          },
        ]}
        el="div"
        fields={clientBlock?.fields ?? []}
        initialState={initialState}
        onChange={[onChange]}
        onSubmit={(formState, newData) => {
          // This is only called when form is submitted from drawer - usually only the case if the block has a custom Block component
          newData.blockType = blockType
          editor.update(() => {
            const node = $getNodeByKey(nodeKey)
            if (node && $isBlockNode(node)) {
              node.setFields(newData as BlockFields, true)
            }
          })
          toggleDrawer()
        }}
        submitted={submitted}
        uuid={uuid()}
      >
        <BlockContent
          baseClass={baseClass}
          BlockDrawer={BlockDrawer}
          Collapsible={BlockCollapsible}
          CustomBlock={CustomBlock}
          CustomLabel={CustomLabel}
          EditButton={EditButton}
          errorCount={errorCount}
          formSchema={clientBlock?.fields ?? []}
          initialState={initialState}
          nodeKey={nodeKey}
          RemoveButton={RemoveButton}
        />
      </Form>
    )
  }, [
    BlockCollapsible,
    BlockDrawer,
    CustomBlock,
    CustomLabel,
    blockType,
    RemoveButton,
    EditButton,
    baseClass,
    editor,
    errorCount,
    toggleDrawer,
    clientBlock?.fields,
    // DO NOT ADD FORMDATA HERE! Adding formData will kick you out of sub block editors while writing.
    initialState,
    nodeKey,
    onChange,
    submitted,
  ])

  if (!clientBlock) {
    return (
      <BlockCollapsible disableBlockName={true} fieldHasErrors={true}>
        <div className={`${baseClass}-not-found`}>
          Error: Block '{blockType}' not found in the config but exists in the lexical data
        </div>
      </BlockCollapsible>
    )
  }

  return Block
}
