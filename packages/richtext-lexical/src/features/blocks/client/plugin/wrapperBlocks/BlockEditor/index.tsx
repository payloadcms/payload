'use client'
import type { LexicalNode } from 'lexical'
import type { BlocksFieldClient, ClientBlock, FormState } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { getTranslation } from '@payloadcms/translations'
import {
  CloseMenuIcon,
  Drawer,
  EditDepthProvider,
  EditIcon,
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
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { reduceFieldsToValues } from 'payload/shared'
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import type { WrapperBlockFields, WrapperBlockNodeType } from '../../../../WrapperBlockNode.js'
import type { AdditionalWrapperBlocksPluginArgs } from '../index.js'

import { useEditorConfigContext } from '../../../../../../lexical/config/client/EditorConfigProvider.js'
import { getSelectedNode } from '../../../../../../lexical/utils/getSelectedNode.js'
import { setFloatingElemPositionForLinkEditor } from '../../../../../../lexical/utils/setFloatingElemPositionForLinkEditor.js'
import { useLexicalDrawer } from '../../../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
import {
  INSERT_WRAPPER_BLOCK_COMMAND,
  TOGGLE_WRAPPER_BLOCK_WITH_MODAL_COMMAND,
} from '../../commands.js'

type WrapperBlockComponentContextType = {
  EditButton?: React.FC
  formData: ({ text: string } & WrapperBlockFields) | undefined
  initialState: false | FormState | undefined
  Label?: React.FC
  RemoveButton?: React.FC
  WrapperBlockContainer?: React.FC<{ children: React.ReactNode }>
  wrapperBlockNode?: WrapperBlockNodeType
}

const WrapperBlockComponentContext = createContext<WrapperBlockComponentContextType>({
  formData: undefined,
  initialState: false,
})

export const useWrapperBlockComponentContext = () => React.useContext(WrapperBlockComponentContext)

export function BlockEditor({
  $createWrapperBlockNode,
  $isWrapperBlockNode,
  anchorElem,
}: { anchorElem: HTMLElement } & AdditionalWrapperBlocksPluginArgs): React.ReactNode {
  const [editor] = useLexicalComposerContext()
  // TO-DO: There are several states that should not be state, because they
  // are derived from linkNode (linkUrl, linkLabel, formData, isLink, isAutoLink...)
  const [wrapperBlockNode, setWrapperBlockNode] = useState<null | WrapperBlockNodeType>()

  const editorRef = useRef<HTMLDivElement | null>(null)
  const [wrapperBlockComponent, setWrapperBlockComponent] = useState<null | React.ReactNode>(null)
  const [wrapperBlockLabelComponent, setWrapperBlockLabelComponent] =
    useState<null | React.ReactNode>(null)
  const [clientBlock, setClientBlock] = useState<ClientBlock | null>(null)
  const { id, collectionSlug, getDocPreferences, globalSlug } = useDocumentInfo()

  const {
    fieldProps: { featureClientSchemaMap, permissions, schemaPath },
    uuid: uuidFromContext,
  } = useEditorConfigContext()

  const [formData, setFormData] = useState<({ text: string } & WrapperBlockFields) | undefined>()
  const { i18n, t } = useTranslation<object, string>()
  const { getFormState } = useServerFunctions()
  const [initialState, setInitialState] = React.useState<false | FormState | undefined>(undefined)
  const [schemaFieldsPath, setSchemaFieldsPath] = React.useState<string | undefined>(undefined)

  const editDepth = useEditDepth()
  const [isWrapperBlockNode, setIsWrapperBlockNode] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<LexicalNode[]>([])

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-rich-text-wrapper-block-` + uuidFromContext,
    depth: editDepth,
  })

  const { toggleDrawer } = useLexicalDrawer(drawerSlug)

  /**
   * Handle drawer and form state
   */
  const onChangeAbortControllerRef = useRef(new AbortController())

  const loadInitialState = useCallback(
    async ({
      formData,
      schemaFieldsPath,
    }: {
      formData: { text: string } & WrapperBlockFields
      schemaFieldsPath: string
    }) => {
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
          setWrapperBlockComponent(state['_components']?.customComponents?.Block)
          setWrapperBlockLabelComponent(state['_components']?.customComponents?.BlockLabel)
        }
      }

      if (formData && !initialState) {
        void awaitInitialState()
      }
    },
    [initialState, getFormState, id, collectionSlug, getDocPreferences, globalSlug],
  )

  const hideBlockPopup = useCallback(() => {
    setIsWrapperBlockNode(false)
    if (editorRef && editorRef.current) {
      editorRef.current.style.opacity = '0'
      editorRef.current.style.transform = 'translate(-10000px, -10000px)'
    }
    setWrapperBlockNode(null)
    setWrapperBlockComponent(null)
    setWrapperBlockLabelComponent(null)
    setClientBlock(null)
    setSelectedNodes([])
    setFormData(undefined)
    setInitialState(undefined)
    setSchemaFieldsPath(undefined)
  }, [])

  const $updateBlockPopup = useCallback(() => {
    const selection = $getSelection()
    let selectedNodeDomRect: DOMRect | undefined

    if (!$isRangeSelection(selection) || !selection) {
      void hideBlockPopup()
      return
    }

    // Handle the data displayed in the floating link editor & drawer when you click on a link node
    const focusNode = getSelectedNode(selection)
    selectedNodeDomRect = editor.getElementByKey(focusNode.getKey())?.getBoundingClientRect()
    const focusWrapperBlockParent = $findMatchingParent(focusNode, $isWrapperBlockNode)

    // Prevent link modal from showing if selection spans further than the link: https://github.com/facebook/lexical/issues/4064
    const badNode = selection
      .getNodes()
      .filter((node) => !$isLineBreakNode(node))
      .find((node) => {
        const wrapperBlockNode = $findMatchingParent(node, $isWrapperBlockNode)
        return (
          (focusWrapperBlockParent && !focusWrapperBlockParent.is(wrapperBlockNode)) ||
          (wrapperBlockNode && !wrapperBlockNode.is(focusWrapperBlockParent))
        )
      })

    if (focusWrapperBlockParent == null || badNode) {
      hideBlockPopup()
      return
    }
    setWrapperBlockNode(focusWrapperBlockParent)

    const fields = focusWrapperBlockParent.getFields()

    // Initial state:
    const data: { text: string } & WrapperBlockFields = {
      ...fields,
      text: focusWrapperBlockParent.getTextContent(),
    }
    const schemaFieldsPath_ = `${schemaPath}.lexical_internal_feature.blocks.lexical_wrapper_blocks.${data.blockType}.fields`
    setSchemaFieldsPath(schemaFieldsPath_)

    setFormData(data)
    setIsWrapperBlockNode(true)
    setSelectedNodes(selection ? selection?.getNodes() : [])

    const componentMapRenderedBlockPath = `${schemaPath}.lexical_internal_feature.blocks.lexical_wrapper_blocks.${data.blockType}`

    const clientSchemaMap = featureClientSchemaMap['blocks']

    const blocksField: BlocksFieldClient = clientSchemaMap[
      componentMapRenderedBlockPath
    ][0] as BlocksFieldClient

    const clientBlock = blocksField.blocks[0]
    setClientBlock(clientBlock)

    void loadInitialState({ formData: data, schemaFieldsPath: schemaFieldsPath_ })

    const editorElem = editorRef.current
    const nativeSelection = window.getSelection()
    const { activeElement } = document

    if (editorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    if (
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      if (!selectedNodeDomRect) {
        // Get the DOM rect of the selected node using the native selection. This sometimes produces the wrong
        // result, which is why we use lexical's selection preferably.
        selectedNodeDomRect = nativeSelection.getRangeAt(0).getBoundingClientRect()
      }

      if (selectedNodeDomRect != null) {
        selectedNodeDomRect.y += 40
        setFloatingElemPositionForLinkEditor(selectedNodeDomRect, editorElem, anchorElem)
      }
    } else if (activeElement == null || activeElement.className !== 'wraper-block-input') {
      hideBlockPopup()
    }

    return true
  }, [
    editor,
    $isWrapperBlockNode,
    schemaPath,
    featureClientSchemaMap,
    loadInitialState,
    hideBlockPopup,
    anchorElem,
  ])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_WRAPPER_BLOCK_WITH_MODAL_COMMAND,
        (payload) => {
          if (!payload) {
            return false
          }
          editor.dispatchCommand(INSERT_WRAPPER_BLOCK_COMMAND, payload.fields)

          // Now, open the modal
          $updateBlockPopup()
          toggleDrawer()

          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, $updateBlockPopup, toggleDrawer, drawerSlug])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = (): void => {
      editor.getEditorState().read(() => {
        void $updateBlockPopup()
      })
    }

    window.addEventListener('resize', update)

    if (scrollerElem != null) {
      scrollerElem.addEventListener('scroll', update)
    }

    return () => {
      window.removeEventListener('resize', update)

      if (scrollerElem != null) {
        scrollerElem.removeEventListener('scroll', update)
      }
    }
  }, [anchorElem.parentElement, editor, $updateBlockPopup])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          void $updateBlockPopup()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          void $updateBlockPopup()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isWrapperBlockNode) {
            hideBlockPopup()

            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, $updateBlockPopup, isWrapperBlockNode, hideBlockPopup])

  useEffect(() => {
    editor.getEditorState().read(() => {
      void $updateBlockPopup()
    })
  }, [editor, $updateBlockPopup])

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
        schemaPath: schemaFieldsPath!,
        signal: controller.signal,
      })

      if (!state) {
        return prevFormState
      }

      if (submit) {
        setWrapperBlockComponent(state['_components']?.customComponents?.Block)
        setWrapperBlockLabelComponent(state['_components']?.customComponents?.BlockLabel)
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
      newData.blockType = formData?.blockType
      editor.update(() => {
        if (wrapperBlockNode && $isWrapperBlockNode(wrapperBlockNode)) {
          wrapperBlockNode.setFields(newData)
        }
      })
    },
    [formData?.blockType, editor, wrapperBlockNode, $isWrapperBlockNode],
  )

  const blockDisplayName = clientBlock?.labels?.singular
    ? getTranslation(clientBlock.labels.singular, i18n)
    : clientBlock?.slug

  const EditButton = useMemo(
    () => () => (
      <button
        aria-label="Edit Wrapper Block"
        className="wrapper-block-edit"
        onClick={() => {
          toggleDrawer()
        }}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        tabIndex={0}
        type="button"
      >
        <EditIcon />
      </button>
    ),
    [toggleDrawer],
  )

  const RemoveButton = useMemo(
    () => () => (
      <button
        aria-label="Remove Wrapper Block"
        className="wrapper-block-trash"
        onClick={() => {
          editor.dispatchCommand(INSERT_WRAPPER_BLOCK_COMMAND, null)
        }}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        tabIndex={0}
        type="button"
      >
        <CloseMenuIcon />
      </button>
    ),
    [editor],
  )

  const Label = useMemo(() => {
    if (wrapperBlockLabelComponent) {
      return () => wrapperBlockLabelComponent
    } else {
      return () => blockDisplayName
    }
  }, [blockDisplayName, wrapperBlockLabelComponent])

  const WrapperBlockContainer = useMemo(
    () =>
      ({ children }: { children: React.ReactNode }) => (
        <div className="wrapper-block-editor" ref={editorRef}>
          <div className="wraper-block-input">{children}</div>
        </div>
      ),
    [],
  )

  if (!initialState || !clientBlock || !schemaFieldsPath) {
    return null
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
      fields={clientBlock?.fields}
      initialState={initialState || {}}
      onChange={[onChange]}
      onSubmit={(formState) => {
        onFormSubmit(formState)
        toggleDrawer()
      }}
      uuid={uuid()}
    >
      {wrapperBlockComponent ? (
        <WrapperBlockComponentContext.Provider
          value={{
            EditButton,
            formData,
            initialState,
            Label,
            RemoveButton,
            WrapperBlockContainer,
            wrapperBlockNode: wrapperBlockNode!,
          }}
        >
          {wrapperBlockComponent}
        </WrapperBlockComponentContext.Provider>
      ) : (
        <WrapperBlockContainer>
          <Label />
          {editor.isEditable() && (
            <React.Fragment>
              <EditButton />
              <RemoveButton />
            </React.Fragment>
          )}
        </WrapperBlockContainer>
      )}

      <EditDepthProvider>
        <Drawer
          className={''}
          slug={drawerSlug}
          title={t(`lexical:blocks:inlineBlocks:${formData?.id ? 'edit' : 'create'}`, {
            label: blockDisplayName ?? t('lexical:blocks:inlineBlocks:label'),
          })}
        >
          {initialState && clientBlock ? (
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
    </Form>
  )
}
