'use client'
import type { Data, Fields } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { formatDrawerSlug } from 'payload/components/elements'
import {
  buildStateFromSchema,
  useAuth,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useLocale,
} from 'payload/components/utilities'
import { sanitizeFields } from 'payload/config'
import { getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { LinkFeatureProps } from '../../..'
import type { LinkNode } from '../../../nodes/LinkNode'
import type { LinkPayload } from '../types'

import { useEditorConfigContext } from '../../../../../lexical/config/EditorConfigProvider'
import { getSelectedNode } from '../../../../../lexical/utils/getSelectedNode'
import { setFloatingElemPositionForLinkEditor } from '../../../../../lexical/utils/setFloatingElemPositionForLinkEditor'
import { LinkDrawer } from '../../../drawer'
import { $isAutoLinkNode } from '../../../nodes/AutoLinkNode'
import { $createLinkNode } from '../../../nodes/LinkNode'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '../../../nodes/LinkNode'
import { transformExtraFields } from '../utilities'
import { TOGGLE_LINK_WITH_MODAL_COMMAND } from './commands'

export function LinkEditor({
  anchorElem,
  disabledCollections,
  enabledCollections,
  fields: customFieldSchema,
  maxDepth,
}: { anchorElem: HTMLElement } & LinkFeatureProps): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const editorRef = useRef<HTMLDivElement | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  const { uuid } = useEditorConfigContext()

  const config = useConfig()

  const { user } = useAuth()
  const { code: locale } = useLocale()
  const { i18n, t } = useTranslation(['fields', 'upload', 'general'])

  const { getDocPreferences } = useDocumentInfo()

  const [initialState, setInitialState] = useState<Fields>({})

  const fieldSchema = useMemo(() => {
    const fieldsUnSanitized = transformExtraFields(
      customFieldSchema,
      config,
      i18n,
      enabledCollections,
      disabledCollections,
      maxDepth,
    )
    // Sanitize custom fields here
    const validRelationships = config.collections.map((c) => c.slug) || []
    return sanitizeFields({
      config,
      fields: fieldsUnSanitized,
      requireFieldLevelRichTextEditor: true,
      validRelationships,
    })
  }, [config, customFieldSchema, disabledCollections, enabledCollections, i18n])

  const { closeModal, toggleModal } = useModal()
  const editDepth = useEditDepth()
  const [isLink, setIsLink] = useState(false)
  const [isAutoLink, setIsAutoLink] = useState(false)

  const drawerSlug = formatDrawerSlug({
    slug: `lexical-rich-text-link-` + uuid,
    depth: editDepth,
  })

  const updateLinkEditor = useCallback(async () => {
    const selection = $getSelection()
    let selectedNodeDomRect: DOMRect | undefined = null

    // Handle the data displayed in the floating link editor & drawer when you click on a link node
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      selectedNodeDomRect = editor.getElementByKey(node.getKey())?.getBoundingClientRect()
      const linkParent: LinkNode = $findMatchingParent(node, $isLinkNode)
      if (linkParent == null) {
        setIsLink(false)
        setIsAutoLink(false)
        setLinkUrl('')
        setLinkLabel('')
        return
      }

      // Initial state:
      const data: LinkPayload = {
        fields: {
          doc: undefined,
          linkType: undefined,
          newTab: undefined,
          url: '',
          ...linkParent.getFields(),
        },
        text: linkParent.getTextContent(),
      }

      if (linkParent.getFields()?.linkType === 'custom') {
        setLinkUrl(linkParent.getFields()?.url ?? '')
        setLinkLabel('')
      } else {
        // internal link
        setLinkUrl(
          `/admin/collections/${linkParent.getFields()?.doc?.relationTo}/${linkParent.getFields()
            ?.doc?.value}`,
        )

        const relatedField = config.collections.find(
          (coll) => coll.slug === linkParent.getFields()?.doc?.relationTo,
        )
        const label = t('fields:linkedTo', {
          label: getTranslation(relatedField.labels.singular, i18n),
        }).replace(/<[^>]*>?/g, '')
        setLinkLabel(label)
      }

      // Set initial state of the drawer. This will basically pre-fill the drawer fields with the
      // values saved in the link node you clicked on.
      const preferences = await getDocPreferences()
      const state = await buildStateFromSchema({
        config,
        data,
        fieldSchema,
        locale,
        operation: 'create',
        preferences,
        t,
        user: user ?? undefined,
      })
      setInitialState(state)
      setIsLink(true)
      if ($isAutoLinkNode(linkParent)) {
        setIsAutoLink(true)
      } else {
        setIsAutoLink(false)
      }
    }

    const editorElem = editorRef.current
    const nativeSelection = window.getSelection()
    const { activeElement } = document

    if (editorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    if (
      selection !== null &&
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
    } else if (activeElement == null || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem)
      }
      setLinkUrl('')
      setLinkLabel('')
    }

    return true
  }, [anchorElem, editor, fieldSchema, config, getDocPreferences, locale, t, user, i18n])

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_LINK_WITH_MODAL_COMMAND,
        (payload: LinkPayload) => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, payload)

          // Now, open the modal
          updateLinkEditor()
            .then(() => {
              toggleModal(drawerSlug)
            })
            .catch((error) => {
              throw error
            })
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor, updateLinkEditor, toggleModal, drawerSlug])

  useEffect(() => {
    if (!isLink && editorRef) {
      editorRef.current.style.opacity = '0'
      editorRef.current.style.transform = 'translate(-10000px, -10000px)'
    }
  }, [isLink])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = (): void => {
      editor.getEditorState().read(() => {
        void updateLinkEditor()
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
  }, [anchorElem.parentElement, editor, updateLinkEditor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          void updateLinkEditor()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          void updateLinkEditor()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false)
            setIsAutoLink(false)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, updateLinkEditor, setIsLink, isLink])

  useEffect(() => {
    editor.getEditorState().read(() => {
      void updateLinkEditor()
    })
  }, [editor, updateLinkEditor])

  return (
    <React.Fragment>
      <div className="link-editor" ref={editorRef}>
        <div className="link-input">
          <a href={linkUrl} rel="noopener noreferrer" target="_blank">
            {linkLabel != null && linkLabel.length > 0 ? linkLabel : linkUrl}
          </a>
          {editor.isEditable() && (
            <React.Fragment>
              <button
                aria-label="Edit link"
                className="link-edit"
                onClick={() => {
                  toggleModal(drawerSlug)
                }}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                tabIndex={0}
                type="button"
              />
              {!isAutoLink && (
                <button
                  aria-label="Remove link"
                  className="link-trash"
                  onClick={() => {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  tabIndex={0}
                  type="button"
                />
              )}
            </React.Fragment>
          )}
        </div>
      </div>
      <LinkDrawer
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        handleModalSubmit={(fields: Fields, data: Data) => {
          closeModal(drawerSlug)

          const newLinkPayload: LinkPayload = data as LinkPayload

          // See: https://github.com/facebook/lexical/pull/5536. This updates autolink nodes to link nodes whenever a change was made (which is good!).
          editor.update(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              const parent = getSelectedNode(selection).getParent()
              if ($isAutoLinkNode(parent)) {
                const linkNode = $createLinkNode({
                  fields: newLinkPayload.fields,
                })
                parent.replace(linkNode, true)
              }
            }
          })

          // Needs to happen AFTER a potential auto link => link node conversion, as otherwise, the updated text to display may be lost due to
          // it being applied to the auto link node instead of the link node.
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, newLinkPayload)
        }}
        initialState={initialState}
      />
    </React.Fragment>
  )
}
