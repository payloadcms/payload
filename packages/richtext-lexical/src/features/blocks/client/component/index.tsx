'use client'

import type { BlocksFieldClient, ClientBlock, CollapsedPreferences, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { getTranslation } from '@payloadcms/translations'
import {
  Button,
  Collapsible,
  Drawer,
  EditDepthProvider,
  ErrorPill,
  formatDrawerSlug,
  Pill,
  SectionTitle,
  ShimmerEffect,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useFormFields,
  useModal,
  useTranslation,
} from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import React, { useCallback, useMemo } from 'react'

import { useEditorConfigContext } from '../../../../lexical/config/client/EditorConfigProvider.js'
import { useLexicalDrawer } from '../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import { RenderLexicalFields } from '../../../../utilities/RenderLexicalFields.js'
import { type BlockCollapsibleWithErrorProps, BlockContent } from './BlockContent.js'
import './index.scss'

type Props = {
  readonly blockType: string
  readonly className: string
  readonly id: string
  readonly nodeKey: string
}

export const BlockComponent: React.FC<Props> = (props) => {
  const { id, blockType, className: baseClass, nodeKey } = props

  const {
    fieldProps: { featureClientSchemaMap, field: parentLexicalRichTextField, path, schemaPath },
    uuid: uuidFromContext,
  } = useEditorConfigContext()

  const editDepth = useEditDepth()

  const { config } = useConfig()

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-blocks-create-${uuidFromContext}-${id}`,
    depth: editDepth,
  })
  const { toggleDrawer } = useLexicalDrawer(drawerSlug)
  const { closeModal } = useModal()

  const { getDocPreferences, setDocFieldPreferences } = useDocumentInfo()
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()

  const blockSchemaPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockType}`
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

  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false)

  const { i18n, t } = useTranslation<object, string>()

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
          if (!newCollapsed.includes(id)) {
            newCollapsed.push(id)
          }
        } else {
          if (newCollapsed.includes(id)) {
            newCollapsed.splice(newCollapsed.indexOf(id), 1)
          }
        }

        setDocFieldPreferences(parentLexicalRichTextField.name, {
          collapsed: newCollapsed,
          hello: 'hi',
        })
      })
    },
    [getDocPreferences, parentLexicalRichTextField.name, setDocFieldPreferences, id],
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
      EditButton,
      RemoveButton,
      blockDisplayName,
      baseClass,
      clientBlock?.admin?.disableBlockName,
      blockType,
      CustomLabel,
      i18n,
      isCollapsed,
      onCollapsedChange,
      isEditable,
    ],
  )

  const blockID = id

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
          <RenderLexicalFields
            fields={clientBlock?.fields ?? []}
            forceRender
            nodeKey={nodeKey}
            parentIndexPath=""
            parentPath={blockFieldsPath}
            parentSchemaPath={blockFieldsSchemaPath}
            permissions={true}
            readOnly={!isEditable}
          />
          <Button onClick={() => closeModal(drawerSlug)}>{t('fields:saveChanges')}</Button>
        </Drawer>
      </EditDepthProvider>
    ),
    [
      closeModal,
      drawerSlug,
      blockID,
      blockDisplayName,
      t,
      isEditable,
      clientBlock?.fields,
      blockFieldsSchemaPath,
      blockFieldsPath,
      nodeKey,
    ],
  )

  if (!clientBlock) {
    return (
      <BlockCollapsible disableBlockName={true} fieldHasErrors={true}>
        <div className={`${baseClass}-not-found`}>
          Error: Block '{blockType}' not found in the config but exists in the lexical data
        </div>
      </BlockCollapsible>
    )
  }

  if (isLoading) {
    return (
      <div className={`${baseClass}__container ${baseClass}-${blockType}`}>
        <ShimmerEffect height={'12rem'} />
      </div>
    )
  }

  return (
    <BlockContent
      baseClass={baseClass}
      BlockDrawer={BlockDrawer}
      Collapsible={BlockCollapsible}
      CustomBlock={CustomBlock}
      EditButton={EditButton}
      errorCount={0}
      formSchema={clientBlock?.fields ?? []}
      nodeKey={nodeKey}
      parentPath={blockFieldsPath}
      parentSchemaPath={blockFieldsSchemaPath}
      RemoveButton={RemoveButton}
    />
  )
}
