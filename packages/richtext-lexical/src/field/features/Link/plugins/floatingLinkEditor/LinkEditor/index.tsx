import type { GridSelection, LexicalEditor, NodeSelection, RangeSelection } from 'lexical'
import type { Field, Fields } from 'payload/types'
import type { Dispatch } from 'react'

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
import { reduceFieldsToValues } from 'payload/components/forms'
import {
  buildStateFromSchema,
  useAuth,
  useConfig,
  useDocumentInfo,
  useEditDepth,
  useLocale,
} from 'payload/components/utilities'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { LinkAttributes } from '../../../nodes/LinkNode'

import { useEditorConfigContext } from '../../../../../lexical/config/EditorConfigProvider'
import { getSelectedNode } from '../../../../../lexical/utils/getSelectedNode'
import { setFloatingElemPositionForLinkEditor } from '../../../../../lexical/utils/setFloatingElemPositionForLinkEditor'
import { LinkDrawer } from '../../../drawer'
import { getBaseFields } from '../../../drawer/baseFields'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '../../../nodes/LinkNode'

export function LinkEditor({ anchorElem }: { anchorElem: HTMLElement }): JSX.Element {
  const [editor] = useLexicalComposerContext()

  const editorRef = useRef<HTMLDivElement | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

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
  const [isLink, setIsLink] = useState(false)

  const drawerSlug = formatDrawerSlug({
    depth: editDepth,
    slug: `rich-text-link-lexicalRichText` + uuid,
  })

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      const linkParent = $findMatchingParent(node, $isLinkNode)
      if (linkParent != null) {
        setIsLink(true)
      } else {
        setIsLink(false)
        setLinkUrl('')
        setLinkLabel('')
        return
      }

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

      data = {
        ...linkParent.getAttributes(),
        fields: undefined,
        text: linkParent.getTextContent(),
      }

      if (linkParent.getAttributes()?.linkType === 'custom') {
        setLinkUrl(linkParent.getAttributes()?.url ?? '')
        setLinkLabel('')
      } else {
        // internal
        setLinkUrl(
          `/admin/collections/${linkParent.getAttributes()?.doc
            ?.relationTo}/${linkParent.getAttributes()?.doc?.value}`,
        )
        setLinkLabel(
          `relation to ${linkParent.getAttributes()?.doc?.relationTo}: ${linkParent.getAttributes()
            ?.doc?.value}`,
        )
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
    } else if (activeElement == null || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem)
      }
      setLinkUrl('')
      setLinkLabel('')
    }

    return true
  }, [anchorElem, editor])

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
    <React.Fragment>
      <div className="link-editor" ref={editorRef}>
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
      </div>
      <LinkDrawer
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
    </React.Fragment>
  )
}
