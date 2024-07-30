'use client'

import type { BaseEditor, BaseOperation } from 'slate'
import type { HistoryEditor } from 'slate-history'
import type { ReactEditor } from 'slate-react'

import isHotkey from 'is-hotkey'
import {
  Error as DefaultError,
  Label as DefaultLabel,
  FieldDescription,
  useField,
  withCondition,
} from 'payload/components/forms'
import { useEditDepth } from 'payload/components/utilities'
import { getTranslation } from 'payload/utilities'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Node, Element as SlateElement, Text, Transforms, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import { Editable, Slate, withReact } from 'slate-react'

import type { ElementNode, FieldProps, RichTextElement, RichTextLeaf, TextNode } from '../types'

import { defaultRichTextValue } from '../data/defaultValue'
import { richTextValidate } from '../data/validation'
import elementTypes from './elements'
import listTypes from './elements/listTypes'
import enablePlugins from './enablePlugins'
import hotkeys from './hotkeys'
import './index.scss'
import leafTypes from './leaves'
import toggleLeaf from './leaves/toggle'
import mergeCustomFunctions from './mergeCustomFunctions'
import withEnterBreakOut from './plugins/withEnterBreakOut'
import withHTML from './plugins/withHTML'

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

const RichText: React.FC<FieldProps> = (props) => {
  const {
    name,
    admin: {
      className,
      components: { Error, Label } = {},
      condition,
      description,
      hideGutter,
      placeholder,
      readOnly,
      style,
      width,
    } = {
      className: undefined,
      components: {},
      condition: undefined,
      description: undefined,
      hideGutter: undefined,
      placeholder: undefined,
      readOnly: undefined,
      style: undefined,
      width: undefined,
    },
    admin,
    defaultValue: defaultValueFromProps,
    label,
    path: pathFromProps,
    required,
    validate = richTextValidate,
  } = props

  const elements: RichTextElement[] = admin?.elements || defaultElements
  const leaves: RichTextLeaf[] = admin?.leaves || defaultLeaves

  const path = pathFromProps || name

  const { i18n } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [enabledElements, setEnabledElements] = useState({})
  const [enabledLeaves, setEnabledLeaves] = useState({})
  const editorRef = useRef(null)
  const toolbarRef = useRef(null)

  const drawerDepth = useEditDepth()
  const drawerIsOpen = drawerDepth > 1

  const renderElement = useCallback(
    ({ attributes, children, element }) => {
      const matchedElement = enabledElements[element.type]
      const Element = matchedElement?.Element

      let attr = { ...attributes }

      // this converts text alignment to margin when dealing with void elements
      if (element.textAlign) {
        if (element.type === 'relationship' || element.type === 'upload') {
          switch (element.textAlign) {
            case 'left':
              attr = { ...attr, style: { marginRight: 'auto' } }
              break
            case 'right':
              attr = { ...attr, style: { marginLeft: 'auto' } }
              break
            case 'center':
              attr = { ...attr, style: { marginLeft: 'auto', marginRight: 'auto' } }
              break
            default:
              attr = { ...attr, style: { textAlign: element.textAlign } }
              break
          }
        } else if (element.type === 'li') {
          switch (element.textAlign) {
            case 'right':
              attr = { ...attr, style: { listStylePosition: 'inside', textAlign: 'right' } }
              break
            case 'center':
              attr = { ...attr, style: { listStylePosition: 'inside', textAlign: 'center' } }
              break
            case 'left':
            default:
              attr = { ...attr, style: { listStylePosition: 'outside', textAlign: 'left' } }
              break
          }
        } else {
          attr = { ...attr, style: { textAlign: element.textAlign } }
        }
      }

      if (Element) {
        const el = (
          <Element
            attributes={attr}
            editorRef={editorRef}
            element={element}
            fieldProps={props}
            path={path}
          >
            {children}
          </Element>
        )

        return el
      }

      return <div {...attr}>{children}</div>
    },
    [enabledElements, path, props],
  )

  const renderLeaf = useCallback(
    ({ attributes, children, leaf }) => {
      const matchedLeaves = Object.entries(enabledLeaves).filter(([leafName]) => leaf[leafName])

      if (matchedLeaves.length > 0) {
        return matchedLeaves.reduce(
          (result, [leafName], i) => {
            if (enabledLeaves[leafName]?.Leaf) {
              const Leaf = enabledLeaves[leafName]?.Leaf
              return (
                <Leaf editorRef={editorRef} fieldProps={props} key={i} leaf={leaf} path={path}>
                  {result}
                </Leaf>
              )
            }

            return result
          },
          <span {...attributes}>{children}</span>,
        )
      }

      return <span {...attributes}>{children}</span>
    },
    [enabledLeaves, path, props],
  )

  const memoizedValidate = useCallback(
    (value, validationOptions) => {
      return validate(value, { ...validationOptions, required })
    },
    [validate, required],
  )

  const fieldType = useField({
    condition,
    path,
    validate: memoizedValidate,
  })

  const { errorMessage, initialValue, setValue, showError, value } = fieldType

  const classes = [
    baseClass,
    'field-type',
    className,
    showError && 'error',
    readOnly && `${baseClass}--read-only`,
    !hideGutter && `${baseClass}--gutter`,
  ]
    .filter(Boolean)
    .join(' ')

  const editor = useMemo(() => {
    let CreatedEditor = withEnterBreakOut(withHistory(withReact(createEditor())))

    CreatedEditor = withHTML(CreatedEditor)
    CreatedEditor = enablePlugins(CreatedEditor, elements)
    CreatedEditor = enablePlugins(CreatedEditor, leaves)

    return CreatedEditor
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, leaves, path])

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
    if (!loaded) {
      const mergedElements = mergeCustomFunctions(elements, elementTypes)
      const mergedLeaves = mergeCustomFunctions(leaves, leafTypes)

      setEnabledElements(mergedElements)
      setEnabledLeaves(mergedLeaves)

      setLoaded(true)
    }
  }, [loaded, elements, leaves])

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

    if (loaded && readOnly) {
      setClickableState('disabled')
    }

    return () => {
      if (loaded && readOnly) {
        setClickableState('enabled')
      }
    }
  }, [loaded, readOnly])

  // useEffect(() => {
  //   // If there is a change to the initial value, we need to reset Slate history
  //   // and clear selection because the old selection may no longer be valid
  //   // as returned JSON may be modified in hooks and have a different shape
  //   if (editor.selection) {
  //     console.log('deselecting');
  //     ReactEditor.deselect(editor);
  //   }
  // }, [path, editor]);

  if (!loaded) {
    return null
  }

  let valueToRender = value

  if (typeof valueToRender === 'string') {
    try {
      const parsedJSON = JSON.parse(valueToRender)
      valueToRender = parsedJSON
    } catch (err) {
      valueToRender = null
    }
  }

  if (!valueToRender) valueToRender = defaultValueFromProps || defaultRichTextValue

  const ErrorComp = Error || DefaultError
  const LabelComp = Label || DefaultLabel

  return (
    <div
      className={classes}
      style={{
        ...style,
        width,
      }}
    >
      <div className={`${baseClass}__wrap`}>
        <ErrorComp message={errorMessage} showError={showError} />
        <LabelComp
          htmlFor={`field-${path.replace(/\./g, '__')}`}
          label={label}
          required={required}
        />
        <Slate
          editor={editor}
          key={JSON.stringify({ initialValue, path })} // makes sure slate is completely re-rendered when initialValue changes, bypassing the slate-internal value memoization. That way, external changes to the form will update the editor
          onChange={handleChange}
          value={valueToRender as any[]}
        >
          <div className={`${baseClass}__wrapper`}>
            {elements?.length + leaves?.length > 0 && (
              <div
                className={[`${baseClass}__toolbar`, drawerIsOpen && `${baseClass}__drawerIsOpen`]
                  .filter(Boolean)
                  .join(' ')}
                ref={toolbarRef}
              >
                <div className={`${baseClass}__toolbar-wrap`}>
                  {elements.map((element, i) => {
                    let elementName: string
                    if (typeof element === 'object' && element?.name) elementName = element.name
                    if (typeof element === 'string') elementName = element

                    const elementType = enabledElements[elementName]
                    const Button = elementType?.Button

                    if (Button) {
                      return <Button fieldProps={props} key={i} path={path} />
                    }

                    return null
                  })}
                  {leaves.map((leaf, i) => {
                    let leafName: string
                    if (typeof leaf === 'object' && leaf?.name) leafName = leaf.name
                    if (typeof leaf === 'string') leafName = leaf

                    const leafType = enabledLeaves[leafName]
                    const Button = leafType?.Button

                    if (Button) {
                      return <Button fieldProps={props} key={i} path={path} />
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
        <FieldDescription description={description} path={path} value={value} />
      </div>
    </div>
  )
}
export default withCondition(RichText)
