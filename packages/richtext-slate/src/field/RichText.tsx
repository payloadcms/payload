'use client'

import type { BaseEditor, BaseOperation } from 'slate'
import type { HistoryEditor } from 'slate-history'
import type { ReactEditor } from 'slate-react'

import { getTranslation } from '@payloadcms/translations'
import { useEditDepth, useField, useTranslation } from '@payloadcms/ui'
import isHotkey from 'is-hotkey'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Node, Element as SlateElement, Text, Transforms, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { Editable, Slate, withReact } from 'slate-react'

import type { FormFieldBase } from '../../../ui/src/forms/fields/shared'
import type { ElementNode, RichTextElement, RichTextLeaf, TextNode } from '../types'

import { withCondition } from '../../../ui/src/forms/withCondition'
import { defaultRichTextValue } from '../data/defaultValue'
import { richTextValidate } from '../data/validation'
import listTypes from './elements/listTypes'
import hotkeys from './hotkeys'
import './index.scss'
import toggleLeaf from './leaves/toggle'
import withEnterBreakOut from './plugins/withEnterBreakOut'
import withHTML from './plugins/withHTML'
import { LeafButtonProvider } from './providers/LeafButtonProvider'
import { LeafProvider } from './providers/LeafProvider'

const defaultElements: RichTextElement[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'indent',
  'link',
  'relationship',
  'upload',
]
const defaultLeaves: RichTextLeaf[] = ['bold', 'italic', 'underline', 'strikethrough', 'code']

const baseClass = 'rich-text'

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: ElementNode
    Text: TextNode
  }
}

const RichText: React.FC<
  FormFieldBase & {
    name: string
    richTextComponentMap: Map<string, React.ReactNode>
  }
> = (props) => {
  const {
    name,
    Description,
    Error,
    Label,
    className,
    path: pathFromProps,
    placeholder,
    readOnly,
    required,
    richTextComponentMap,
    style,
    validate = richTextValidate,
    width,
  } = props

  const [leaves] = useState(() => {
    const enabledLeaves: Record<
      string,
      {
        Button: React.ReactNode
        Leaf: React.ReactNode
        name: string
      }
    > = {}

    for (const [key, value] of richTextComponentMap) {
      if (key.startsWith('leaf.button.') || key.startsWith('leaf.component.')) {
        const leafName = key.replace('leaf.button.', '').replace('leaf.component.', '')

        if (!enabledLeaves[leafName]) {
          enabledLeaves[leafName] = {
            name: leafName,
            Button: null,
            Leaf: null,
          }
        }

        if (key.startsWith('leaf.button.')) enabledLeaves[leafName].Button = value
        if (key.startsWith('leaf.component.')) enabledLeaves[leafName].Leaf = value
      }
    }

    return enabledLeaves
  })

  const elements: RichTextElement[] = defaultElements

  const { i18n } = useTranslation()
  const editorRef = useRef(null)
  const toolbarRef = useRef(null)

  const drawerDepth = useEditDepth()
  const drawerIsOpen = drawerDepth > 1

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      if (typeof validate === 'function') {
        return validate(value, { ...validationOptions, required })
      }
    },
    [validate, required],
  )

  const { initialValue, path, schemaPath, setValue, showError, value } = useField({
    path: pathFromProps || name,
    validate: memoizedValidate,
  })

  const renderElement = useCallback(({ attributes, children, element }) => {
    // const matchedElement = enabledElements[element.type]
    // const Element = matchedElement?.Element

    const attr = { ...attributes }

    // // this converts text alignment to margin when dealing with void elements
    // if (element.textAlign) {
    //   if (element.type === 'relationship' || element.type === 'upload') {
    //     switch (element.textAlign) {
    //       case 'left':
    //         attr = { ...attr, style: { marginRight: 'auto' } }
    //         break
    //       case 'right':
    //         attr = { ...attr, style: { marginLeft: 'auto' } }
    //         break
    //       case 'center':
    //         attr = { ...attr, style: { marginLeft: 'auto', marginRight: 'auto' } }
    //         break
    //       default:
    //         attr = { ...attr, style: { textAlign: element.textAlign } }
    //         break
    //     }
    //   } else if (element.type === 'li') {
    //     switch (element.textAlign) {
    //       case 'right':
    //         attr = { ...attr, style: { listStylePosition: 'inside', textAlign: 'right' } }
    //         break
    //       case 'center':
    //         attr = { ...attr, style: { listStylePosition: 'inside', textAlign: 'center' } }
    //         break
    //       case 'left':
    //       default:
    //         attr = { ...attr, style: { listStylePosition: 'outside', textAlign: 'left' } }
    //         break
    //     }
    //   } else {
    //     attr = { ...attr, style: { textAlign: element.textAlign } }
    //   }
    // }

    // if (Element) {
    //   const el = (
    //     <Element
    //       attributes={attr}
    //       editorRef={editorRef}
    //       element={element}
    //       fieldProps={props}
    //       path={path}
    //     >
    //       {children}
    //     </Element>
    //   )

    //   return el
    // }

    return <div {...attr}>{children}</div>
  }, [])

  const renderLeaf = useCallback(
    ({ attributes, children, leaf }) => {
      const matchedLeaves = Object.entries(leaves).filter(([leafName]) => leaf[leafName])

      if (matchedLeaves.length > 0) {
        return matchedLeaves.reduce(
          (result, [, leafConfig], i) => {
            if (leafConfig?.Leaf) {
              const Leaf = leafConfig.Leaf

              return (
                <LeafProvider
                  attributes={attributes}
                  editorRef={editorRef}
                  fieldProps={props}
                  key={i}
                  leaf={leaf}
                  path={path}
                  result={result}
                  schemaPath={schemaPath}
                >
                  {Leaf}
                </LeafProvider>
              )
            }

            return result
          },
          <span {...attributes}>{children}</span>,
        )
      }

      return <span {...attributes}>{children}</span>
    },
    [path, props, schemaPath, leaves],
  )

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
  ]
    .filter(Boolean)
    .join(' ')

  const editor = useMemo(() => {
    let CreatedEditor = withEnterBreakOut(withHistory(withReact(createEditor())))

    CreatedEditor = withHTML(CreatedEditor)
    // CreatedEditor = enablePlugins(CreatedEditor, elements)
    // CreatedEditor = enablePlugins(CreatedEditor, leaves)

    return CreatedEditor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  // All slate changes fire the onChange event
  // including selection changes
  // so we will filter the set_selection operations out
  // and only fire setValue when onChange is because of value
  const handleChange = useCallback(
    (val: unknown) => {
      const ops = editor.operations.filter((o: BaseOperation) => {
        if (o) {
          return o.type !== 'set_selection'
        }
        return false
      })

      if (ops && Array.isArray(ops) && ops.length > 0) {
        if (!readOnly && val !== defaultRichTextValue && val !== value) {
          setValue(val)
        }
      }
    },
    [editor.operations, readOnly, setValue, value],
  )

  useEffect(() => {
    function setClickableState(clickState: 'disabled' | 'enabled') {
      const selectors = 'button, a, [role="button"]'
      const toolbarButtons: (HTMLAnchorElement | HTMLButtonElement)[] =
        toolbarRef.current?.querySelectorAll(selectors)

      ;(toolbarButtons || []).forEach((child) => {
        const isButton = child.tagName === 'BUTTON'
        const isDisabling = clickState === 'disabled'
        child.setAttribute('tabIndex', isDisabling ? '-1' : '0')
        if (isButton) child.setAttribute('disabled', isDisabling ? 'disabled' : null)
      })
    }

    if (readOnly) {
      setClickableState('disabled')
    }

    return () => {
      if (readOnly) {
        setClickableState('enabled')
      }
    }
  }, [readOnly])

  // useEffect(() => {
  //   // If there is a change to the initial value, we need to reset Slate history
  //   // and clear selection because the old selection may no longer be valid
  //   // as returned JSON may be modified in hooks and have a different shape
  //   if (editor.selection) {
  //     console.log('deselecting');
  //     ReactEditor.deselect(editor);
  //   }
  // }, [path, editor]);

  let valueToRender = value

  if (typeof valueToRender === 'string') {
    try {
      const parsedJSON = JSON.parse(valueToRender)
      valueToRender = parsedJSON
    } catch (err) {
      valueToRender = null
    }
  }

  if (!valueToRender) valueToRender = defaultRichTextValue

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        {Error}
        {Label}
        <Slate
          editor={editor}
          key={JSON.stringify({ initialValue, path })} // makes sure slate is completely re-rendered when initialValue changes, bypassing the slate-internal value memoization. That way, external changes to the form will update the editor
          onChange={handleChange}
          value={valueToRender as any[]}
        >
          <div className={`${baseClass}__wrapper`}>
            {elements?.length + Object.keys(leaves)?.length > 0 && (
              <div
                className={[`${baseClass}__toolbar`, drawerIsOpen && `${baseClass}__drawerIsOpen`]
                  .filter(Boolean)
                  .join(' ')}
                ref={toolbarRef}
              >
                <div className={`${baseClass}__toolbar-wrap`}>
                  {/* {elements.map((element, i) => {
                    let elementName: string
                    if (typeof element === 'object' && element?.name) elementName = element.name
                    if (typeof element === 'string') elementName = element

                    const elementType = enabledElements[elementName]
                    const Button = elementType?.Button

                    if (Button) {
                      return <Button fieldProps={props} key={i} path={path} />
                    }

                    return null
                  })} */}
                  {Object.values(leaves).map((leaf, i) => {
                    const Button = leaf?.Button

                    if (Button) {
                      return (
                        <LeafButtonProvider
                          fieldProps={props}
                          key={i}
                          path={path}
                          schemaPath={schemaPath}
                        >
                          {Button}
                        </LeafButtonProvider>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            )}
            <div className={`${baseClass}__editor`} ref={editorRef}>
              <Editable
                className={`${baseClass}__input`}
                id={`field-${path.replace(/\./g, '__')}`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (event.shiftKey) {
                      event.preventDefault()
                      editor.insertText('\n')
                    } else {
                      const selectedElement = Node.descendant(
                        editor,
                        editor.selection.anchor.path.slice(0, -1),
                      )

                      if (SlateElement.isElement(selectedElement)) {
                        // Allow hard enter to "break out" of certain elements
                        if (editor.shouldBreakOutOnEnter(selectedElement)) {
                          event.preventDefault()
                          const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path)

                          if (
                            Text.isText(selectedLeaf) &&
                            String(selectedLeaf.text).length === editor.selection.anchor.offset
                          ) {
                            Transforms.insertNodes(editor, { children: [{ text: '' }] })
                          } else {
                            Transforms.splitNodes(editor)
                            Transforms.setNodes(editor, {})
                          }
                        }
                      }
                    }
                  }

                  if (event.key === 'Backspace') {
                    const selectedElement = Node.descendant(
                      editor,
                      editor.selection.anchor.path.slice(0, -1),
                    )

                    if (SlateElement.isElement(selectedElement) && selectedElement.type === 'li') {
                      const selectedLeaf = Node.descendant(editor, editor.selection.anchor.path)
                      if (Text.isText(selectedLeaf) && String(selectedLeaf.text).length === 0) {
                        event.preventDefault()
                        Transforms.unwrapNodes(editor, {
                          match: (n) => SlateElement.isElement(n) && listTypes.includes(n.type),
                          mode: 'lowest',
                          split: true,
                        })

                        Transforms.setNodes(editor, { type: undefined })
                      }
                    } else if (editor.isVoid(selectedElement)) {
                      Transforms.removeNodes(editor)
                    }
                  }

                  Object.keys(hotkeys).forEach((hotkey) => {
                    if (isHotkey(hotkey, event as any)) {
                      event.preventDefault()
                      const mark = hotkeys[hotkey]
                      toggleLeaf(editor, mark)
                    }
                  })
                }}
                placeholder={getTranslation(placeholder, i18n)}
                readOnly={readOnly}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                spellCheck
              />
            </div>
          </div>
        </Slate>
        {Description}
      </div>
    </div>
  )
}

export default withCondition(RichText)
