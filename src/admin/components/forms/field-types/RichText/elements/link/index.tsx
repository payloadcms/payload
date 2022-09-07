import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms, Node, Editor, Range } from 'slate';
import { useModal } from '@faceless-ui/modal';
import ElementButton from '../Button';
import { unwrapLink, withLinks } from './utilities';
import LinkIcon from '../../../../../icons/Link';
import Popup from '../../../../../elements/Popup';
import { EditModal } from './Modal';
import { modalSlug } from './shared';
import isElementActive from '../isActive';

import './index.scss';

const baseClass = 'rich-text-link';

// TODO: Multiple modal windows stacked go boom (rip). Edit Upload in fields -> rich text

const Link = ({ attributes, children, element, editorRef }) => {
  const editor = useSlate();
  const { open, closeAll } = useModal();
  const [renderModal, setRenderModal] = useState(false);
  const [renderPopup, setRenderPopup] = useState(false);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});

  const handleTogglePopup = useCallback((render) => {
    if (!render) {
      setRenderPopup(render);
    }
  }, []);

  useEffect(() => {
    setInitialData({
      newTab: element.newTab,
      text: Node.string(element),
      url: element.url,
    });
  }, [renderModal, element]);

  return (
    <span
      className={baseClass}
      {...attributes}
    >
      <span
        style={{ userSelect: 'none' }}
        contentEditable={false}
      >
        {renderModal && (
          <EditModal
            close={() => {
              closeAll();
              setRenderModal(false);
            }}
            handleModalSubmit={(_, data) => {
              closeAll();
              setRenderModal(false);

              const [, parentPath] = Editor.above(editor);

              Transforms.setNodes(
                editor,
                {
                  newTab: data.newTab,
                  url: data.url,
                },
                { at: parentPath },
              );

              Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'block' });
              Transforms.move(editor, { distance: 1, unit: 'offset' });
              Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });

              ReactEditor.focus(editor);
            }}
            initialData={initialData}
          />
        )}
        <Popup
          buttonType="none"
          size="small"
          forceOpen={renderPopup}
          onToggleOpen={handleTogglePopup}
          horizontalAlign="left"
          verticalAlign="bottom"
          boundingRef={editorRef}
          render={() => (
            <div className={`${baseClass}__popup`}>
              Go to link:&nbsp;
              <a
                className={`${baseClass}__goto-link`}
                href={element.url}
                target="_blank"
                rel="noreferrer"
              >
                {element.url}
              </a>
              &mdash;
              <button
                type="button"
                onClick={() => {
                  setRenderPopup(false);
                  open(modalSlug);
                  setRenderModal(true);
                }}
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => {
                  unwrapLink(editor);
                }}
              >
                Remove
              </button>
            </div>
          )}
        />
      </span>
      <span
        tabIndex={0}
        role="button"
        className={[
          `${baseClass}__button`,
        ].filter(Boolean).join(' ')}
        onKeyDown={(e) => { if (e.key === 'Enter') setRenderPopup(true); }}
        onClick={() => setRenderPopup(true)}
      >
        {children}
      </span>
    </span>
  );
};

const LinkButton = () => {
  const editor = useSlate();
  const { open, closeAll } = useModal();
  const [renderModal, setRenderModal] = useState(false);
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});

  return (
    <Fragment>
      <ElementButton
        format="link"
        onClick={() => {
          if (isElementActive(editor, 'link')) {
            unwrapLink(editor);
          } else {
            open(modalSlug);
            setRenderModal(true);

            const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);

            if (!isCollapsed) {
              setInitialData({
                text: Editor.string(editor, editor.selection),
              });
            }
          }
        }}
      >
        <LinkIcon />
      </ElementButton>
      {renderModal && (
        <EditModal
          initialData={initialData}
          close={() => {
            closeAll();
            setRenderModal(false);
          }}
          handleModalSubmit={(_, data) => {
            const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);

            const newLink = {
              type: 'link',
              url: data.url,
              newTab: data.newTab,
              children: [],
            };

            if (isCollapsed) {
              // If selection anchor and focus are the same,
              // Just inject a new node with children already set
              Transforms.insertNodes(editor, {
                ...newLink,
                children: [{ text: String(data.text) }],
              });
            } else {
              // Otherwise we need to wrap the selected node in a link,
              // Delete its old text,
              // Move the selection one position forward into the link,
              // And insert the text back into the new link
              Transforms.wrapNodes(editor, newLink, { split: true });
              Transforms.delete(editor, { at: editor.selection.focus.path, unit: 'word' });
              Transforms.move(editor, { distance: 1, unit: 'offset' });
              Transforms.insertText(editor, String(data.text), { at: editor.selection.focus.path });
            }

            closeAll();
            setRenderModal(false);

            ReactEditor.focus(editor);
          }}
        />
      )}
    </Fragment>
  );
};

const link = {
  Button: LinkButton,
  Element: Link,
  plugins: [
    withLinks,
  ],
};

export default link;
