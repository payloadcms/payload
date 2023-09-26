/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';

import type { Fields } from 'payload/types'

import { useModal } from '@faceless-ui/modal'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  type GridSelection,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
  type NodeSelection,
  type RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { formatDrawerSlug } from 'payload/components/elements'
import { reduceFieldsToValues } from 'payload/components/forms'
import {
  buildStateFromSchema,
  useAuth,
  useConfig,
  useDocumentInfo,
  useEditDepth,
} from 'payload/components/utilities'
import { useLocale } from 'payload/components/utilities'
import { type Field } from 'payload/types'
import { type Dispatch, useCallback, useEffect, useRef, useState } from 'react'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { useEditorConfigContext } from '../../../lexical/config/EditorConfigProvider'
import { getSelectedNode } from '../../../lexical/utils/getSelectedNode'
import { setFloatingElemPositionForLinkEditor } from '../../../lexical/utils/setFloatingElemPositionForLinkEditor'
import { $isAutoLinkNode } from '../nodes/AutoLinkNode'
import { $isLinkNode, type LinkAttributes, TOGGLE_LINK_COMMAND } from '../nodes/LinkNode'
import { LinkDrawer } from './LinkDrawer'
import { getBaseFields } from './LinkDrawer/baseFields'
import './index.scss'

function LinkEditor({
  anchorElem,
  editor,
  isLink,
  setIsLink,
}: {
  anchorElem: HTMLElement
  editor: LexicalEditor
  isLink: boolean
  setIsLink: Dispatch<boolean>
}): JSX.Element {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [lastSelection, setLastSelection] = useState<
    GridSelection | NodeSelection | RangeSelection | null
  >(null)
  const { uuid } = useEditorConfigContext()

  const customFieldSchema = false /* fieldProps?.admin?.link?.fields */ // TODO: Field props
  const config = useConfig()

  const { user } = useAuth()
  const { code: locale } = useLocale()
  const { t } = useTranslation('fields')

  const { getDocPreferences } = useDocumentInfo()

  const [initialState, setInitialState] = useState<Fields>({})
  const [fieldSchema] = useState(() => {
    const fields: Field[] = [...getBaseFields(config)]

    if (customFieldSchema) {
      fields.push({
        name: 'fields',
        admin: {
          style: {
            borderBottom: 0,
            borderTop: 0,
            margin: 0,
            padding: 0,
          },
        },
        fields: customFieldSchema,
        type: 'group',
      })
    }

    fields.push({
      name: 'sponsored',
      admin: {
        condition: ({ linkType }) => {
          return linkType === 'custom'
        },
      },
      label: 'Sponsored',
      type: 'checkbox',
    })

    fields.push({
      name: 'nofollow',
      admin: {
        condition: ({ linkType }) => {
          return linkType === 'custom'
        },
      },
      label: 'Nofollow',
      type: 'checkbox',
    })

    return fields
  })

  const { closeModal, isModalOpen, toggleModal } = useModal()
  const editDepth = useEditDepth()

  const drawerSlug = formatDrawerSlug({
    depth: editDepth,
    slug: `rich-text-link-lexicalRichText` + uuid,
  })

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const parent = node.getParent()

      // Initial state thingy

      // Initial state:
      let data: LinkAttributes & { fields: undefined; text: string } = {
        doc: undefined,
        fields: undefined,
        linkType: undefined,
        newTab: undefined,
        nofollow: undefined,
        sponsored: undefined,
        text: '',
        url: '',
      }

      if ($isLinkNode(parent)) {
        data = {
          ...parent.getAttributes(),
          fields: undefined,
          text: parent.getTextContent(),
        }

        if (parent.getAttributes()?.linkType === 'custom') {
          setLinkUrl(parent.getAttributes()?.url ?? '')
          setLinkLabel('')
        } else {
          // internal
          setLinkUrl(
            `/admin/collections/${parent.getAttributes()?.doc?.relationTo}/${parent.getAttributes()
              ?.doc?.value}`,
          )
          setLinkLabel(
            `relation to ${parent.getAttributes()?.doc?.relationTo}: ${parent.getAttributes()?.doc
              ?.value}`,
          )
        }
      } else if ($isLinkNode(node)) {
        data = {
          ...node.getAttributes(),
          fields: undefined,
          text: node.getTextContent(),
        }

        if (node.getAttributes()?.linkType === 'custom') {
          setLinkUrl(node.getAttributes()?.url ?? '')
          setLinkLabel('')
        } else {
          // internal
          setLinkUrl(
            `/admin/collections/${parent?.getAttributes()?.doc
              ?.relationTo}/${parent?.getAttributes()?.doc?.value}`,
          )
          setLinkLabel(
            `relation to ${parent?.getAttributes()?.doc?.relationTo}: ${parent?.getAttributes()?.doc
              ?.value}`,
          )
        }
      } else {
        setLinkUrl('')
        setLinkLabel('')
      }
      void getDocPreferences().then((preferences) => {
        void buildStateFromSchema({
          data,
          fieldSchema,
          locale,
          operation: 'create',
          preferences,
          t,
          user: user ?? undefined,
        }).then((state) => {
          setInitialState(state)
        })
      })
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
      rootElement.contains(nativeSelection.anchorNode) &&
      editor.isEditable()
    ) {
      const domRect: DOMRect | undefined =
        nativeSelection.focusNode?.parentElement?.getBoundingClientRect()
      if (domRect != null) {
        domRect.y += 40
        setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem)
      }
      setLastSelection(selection)
    } else if (activeElement == null || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem)
      }
      setLastSelection(null)
      setLinkUrl('')
      setLinkLabel('')
    }

    return true
  }, [anchorElem, editor])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = (): void => {
      editor.getEditorState().read(() => {
        updateLinkEditor()
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
          updateLinkEditor()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor()
          return true
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false)
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
      updateLinkEditor()
    })
  }, [editor, updateLinkEditor])

  return (
    <div className="link-editor" ref={editorRef}>
      <LinkDrawer // TODO: Might aswell import from payload/distadmin/components/forms/field-types/RichText/elements/link/LinkDrawer/index.tsx instead?
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        handleClose={() => {
          closeModal(drawerSlug)
        }}
        handleModalSubmit={(fields: Fields) => {
          closeModal(drawerSlug)

          const data = reduceFieldsToValues(fields, true)

          const newNode: LinkAttributes & { text?: string } = {
            doc: data.linkType === 'internal' ? data.doc : undefined,
            linkType: data.linkType,
            newTab: data.newTab,
            nofollow: data.nofollow,
            sponsored: data.sponsored,
            text: data?.text,
            url: data.linkType === 'custom' ? data.url : undefined,
          }

          /* if (customFieldSchema) {
              newNode.fields += data.fields;
            } */ // TODO

          editor.dispatchCommand(TOGGLE_LINK_COMMAND, newNode)
        }}
        initialState={initialState}
      />
      {isLink && !isModalOpen(drawerSlug) && (
        <div className="link-input">
          <a href={linkUrl} rel="noopener noreferrer" target="_blank">
            {linkLabel != null && linkLabel.length > 0 ? linkLabel : linkUrl}
          </a>
          <div
            className="link-edit"
            onClick={() => {
              toggleModal(drawerSlug)
            }}
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            role="button"
            tabIndex={0}
          />
          <div
            className="link-trash"
            onClick={() => {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
            }}
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            role="button"
            tabIndex={0}
          />
        </div>
      )}
    </div>
  )
}
export const UseFloatingLinkEditorToolbar: React.FC<{
  anchorElem: HTMLElement
}> = ({ anchorElem }) => {
  const [editor] = useLexicalComposerContext()

  const [activeEditor, setActiveEditor] = useState(editor)
  const [isLink, setIsLink] = useState(false)

  const updateToolbar = useCallback(async () => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const linkParent = $findMatchingParent(node, $isLinkNode)
      const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode)
      if (linkParent != null || autoLinkParent != null) {
        setIsLink(true)
      } else {
        setIsLink(false)
      }
    }
  }, [])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          void updateToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          void updateToolbar()
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [editor, updateToolbar])

  return createPortal(
    <LinkEditor
      anchorElem={anchorElem}
      editor={activeEditor}
      isLink={isLink}
      setIsLink={setIsLink}
    />,
    anchorElem,
  )
}

export const FloatingLinkEditorPlugin: React.FC<{
  anchorElem?: HTMLElement
}> = ({ anchorElem = document.body }) => {
  return <UseFloatingLinkEditorToolbar anchorElem={anchorElem} />
}
