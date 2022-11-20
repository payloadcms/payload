/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.scss';

import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  LexicalEditor,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { Modal, useModal } from '@faceless-ui/modal';
import LinkPreview from '../../ui/LinkPreview';
import { getSelectedNode } from '../../utils/getSelectedNode';
import {sanitizeUrl} from '../../utils/url';
import { setFloatingElemPosition } from '../../utils/setFloatingElemPosition';
import MinimalTemplate from '../../../../../templates/Minimal';
import Button from '../../../../../elements/Button';
import './modal.scss';
import RenderFields from '../../../../RenderFields';
import fieldTypes from '../../../index';
import FormSubmit from '../../../../Submit';
import Form from '../../../../Form';
import reduceFieldsToValues from '../../../../Form/reduceFieldsToValues';
import { Fields } from '../../../../Form/types';
import { Field } from '../../../../../../../fields/config/types';
import { getBaseFields } from '../../../RichText/elements/link/Modal/baseFields';
import { useConfig } from '../../../../../utilities/Config';

function LinkEditor({
  editor,
  anchorElem,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
}): JSX.Element {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isEditMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<
    RangeSelection | GridSelection | NodeSelection | null
  >(null);

  const {
    toggleModal,
    isModalOpen,
  } = useModal();
  const modalSlug = 'lexicalRichText-edit-link';
  const baseModalClass = 'rich-text-link-edit-modal';

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl('');
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const { activeElement } = document;

    if (editorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();

    if (
      selection !== null
      && nativeSelection !== null
      && rootElement !== null
      && rootElement.contains(nativeSelection.anchorNode)
    ) {
      const domRange = nativeSelection.getRangeAt(0);
      let rect;
      if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
          inner = inner.firstElementChild as HTMLElement;
        }
        rect = inner.getBoundingClientRect();
      } else {
        rect = domRange.getBoundingClientRect();
      }

      setFloatingElemPosition(rect, editorElem, anchorElem);
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== 'link-input') {
      if (rootElement !== null) {
        setFloatingElemPosition(null, editorElem, anchorElem);
      }
      setLastSelection(null);
      setEditMode(false);
      setLinkUrl('');
    }

    return true;
  }, [anchorElem, editor]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        updateLinkEditor();
      });
    };

    window.addEventListener('resize', update);

    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);

      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [anchorElem.parentElement, editor, updateLinkEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateLinkEditor]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      updateLinkEditor();
    });
  }, [editor, updateLinkEditor]);


  const customFieldSchema = false/* fieldProps?.admin?.link?.fields */; // TODO: Field props
  const config = useConfig();

  const [initialState, setInitialState] = useState<Fields>({});
  const [fieldSchema] = useState(() => {
    const fields: Field[] = [
      ...getBaseFields(config),
    ];

    if (customFieldSchema) {
      fields.push({
        name: 'fields',
        type: 'group',
        admin: {
          style: {
            margin: 0,
            padding: 0,
            borderTop: 0,
            borderBottom: 0,
          },
        },
        fields: customFieldSchema,
      });
    }

    return fields;
  });

  return (
    <div
      ref={editorRef}
      className="link-editor"
    >
      {isEditMode && isModalOpen(modalSlug) ? (
        <Modal
          className={baseModalClass}
          slug={modalSlug}
        >
          <EditLinkModal
            editor={editor}
            setEditMode={setEditMode}
            modalSlug={modalSlug}
            fieldSchema={fieldSchema}
            initialState={initialState}
            handleModalSubmit={(fields) => {
              console.log('Submit! fields:', fields);
              setLinkUrl(fields.url.value);

              return;
              const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);
              const data = reduceFieldsToValues(fields, true);

              const newLink = {
                type: 'link',
                linkType: data.linkType,
                url: data.url,
                doc: data.doc,
                newTab: data.newTab,
                fields: data.fields,
                children: [],
              };

              if (isCollapsed || !editor.selection) {
                // If selection anchor and focus are the same,
                // Just inject a new node with children already set
                Transforms.insertNodes(editor, {
                  ...newLink,
                  children: [{ text: String(data.text) }],
                });
              } else if (editor.selection) {
                // Otherwise we need to wrap the selected node in a link,
                // Delete its old text,
                // Move the selection one position forward into the link,
                // And insert the text back into the new link
                Transforms.wrapNodes(editor, newLink, { split: true });
                Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' });
                Transforms.move(editor, { distance: 1, unit: 'offset' });
                Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
              }

              setEditMode(false);
              toggleModal(modalSlug);
              ReactEditor.focus(editor);
            }}
          />
        </Modal>
      ) : (
        <React.Fragment>
          <div className="link-input">
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkUrl}
            </a>
            <div
              className="link-edit"
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setEditMode(true);
                toggleModal(modalSlug);
              }}
            />
          </div>
          <LinkPreview url={linkUrl} />
        </React.Fragment>
      )}
    </div>
  );
}

function useFloatingLinkEditorToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
): JSX.Element | null {
  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLink, setIsLink] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = $findMatchingParent(node, $isLinkNode);
      const autoLinkParent = $findMatchingParent(node, $isAutoLinkNode);

      // We don't want this menu to open for auto links.
      if (linkParent != null && autoLinkParent == null) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  return isLink
    ? createPortal(
      <LinkEditor
        editor={activeEditor}
        anchorElem={anchorElem}
      />,
      anchorElem,
    )
    : null;
}

export default function FloatingLinkEditorPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingLinkEditorToolbar(editor, anchorElem);
}


export function EditLinkModal({
  editor,
  setEditMode,
  modalSlug,
  handleModalSubmit,
  initialState,
  fieldSchema,
}: {
  editor: LexicalEditor;
  setEditMode;
  modalSlug: string;
  handleModalSubmit;
  initialState;
  fieldSchema;
}): JSX.Element {
  const baseModalClass = 'rich-text-link-edit-modal';
  const {
    toggleModal,
  } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);
  if (inputRef.current) {
    inputRef.current.focus();
  }

  return (
    <React.Fragment>
      <MinimalTemplate className={`${baseModalClass}__template`}>
        <header className={`${baseModalClass}__header`}>
          <h3>
            Edit Link
          </h3>
          <Button
            icon="x"
            round
            buttonStyle="icon-label"
            iconStyle="with-border"
            onClick={() => {
              setEditMode(false);
              toggleModal(modalSlug);
            }}
          />
        </header>
        {/* Add functionality here
        <input
          ref={inputRef}
          className="link-input"
          value={linkUrl}
          onChange={(event) => {
            setLinkUrl(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (lastSelection !== null) {
                if (linkUrl !== '') {
                  editor.dispatchCommand(
                    TOGGLE_LINK_COMMAND,
                    sanitizeUrl(linkUrl),
                  );
                }
                setEditMode(false);
              }
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setEditMode(false);
            }
          }}/> */ }
        <Form
          onSubmit={handleModalSubmit}
          initialState={initialState}
        >
          <RenderFields
            fieldTypes={fieldTypes}
            readOnly={false}
            fieldSchema={fieldSchema}
            forceRender
          />
          <FormSubmit>
            Confirm
          </FormSubmit>
        </Form>
      </MinimalTemplate>
    </React.Fragment>
  );
}
