import React, { useCallback } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, Element, Transforms } from 'slate';
import IndentLeft from '../../../../../icons/IndentLeft';
import IndentRight from '../../../../../icons/IndentRight';
import { baseClass } from '../Button';
import isElementActive from '../isActive';
import listTypes from '../listTypes';

const indentType = 'indent';

const IndentWithPadding = ({ attributes, children }) => (
  <div
    style={{ paddingLeft: 25 }}
    {...attributes}
  >
    {children}
  </div>
);

const indent = {
  Button: () => {
    const editor = useSlate();
    const handleIndent = useCallback((e, dir) => {
      e.preventDefault();

      if (dir === 'left') {
        Transforms.unwrapNodes(editor, {
          match: (n) => Element.isElement(n) && [indentType, ...listTypes].includes(n.type),
          split: true,
          mode: 'lowest',
        });

        if (isElementActive(editor, 'li')) {
          const [, parentLocation] = Editor.parent(editor, editor.selection);
          const [, parentDepth] = parentLocation;

          if (parentDepth > 0 || parentDepth === 0) {
            Transforms.unwrapNodes(editor, {
              match: (n) => Element.isElement(n) && n.type === 'li',
              split: true,
              mode: 'lowest',
            });
          } else {
            Transforms.unsetNodes(editor, ['type']);
          }
        }
      }

      if (dir === 'right') {
        const isCurrentlyOL = isElementActive(editor, 'ol');
        const isCurrentlyUL = isElementActive(editor, 'ul');

        if (isCurrentlyOL || isCurrentlyUL) {
          let hasText = false;

          if (editor.selection) {
            const leafNode = Editor.leaf(editor, editor.selection.focus);
            if (leafNode) {
              const [leaf] = leafNode;
              hasText = leaf.text.length > 0;
            }
          }

          if (hasText) {
            Transforms.wrapNodes(editor, {
              type: 'li',
              children: [],
            });
            Transforms.wrapNodes(editor, { type: isCurrentlyOL ? 'ol' : 'ul', children: [{ text: ' ' }] });
            Transforms.setNodes(editor, { type: 'li' });
          } else {
            const [previousNode, previousNodePath] = Editor.previous(editor, {
              at: editor.selection.focus,
            });

            Transforms.removeNodes(editor);

            Transforms.insertNodes(
              editor,
              [
                {
                  children: [
                    previousNode,
                  ],
                },
                {
                  type: isCurrentlyOL ? 'ol' : 'ul',
                  children: [
                    {
                      type: 'li',
                      children: [
                        {
                          text: '',
                        },
                      ],
                    },
                  ],
                },
              ],
              {
                at: previousNodePath,
                select: true,
              },
            );
          }
        } else {
          Transforms.wrapNodes(editor, { type: indentType, children: [] });
        }
      }

      ReactEditor.focus(editor);
    }, [editor]);

    const canDeIndent = isElementActive(editor, 'li') || isElementActive(editor, indentType);

    return (
      <React.Fragment>
        <button
          type="button"
          className={[
            baseClass,
            !canDeIndent && `${baseClass}--disabled`,
          ].filter(Boolean).join(' ')}
          onClick={canDeIndent ? (e) => handleIndent(e, 'left') : undefined}
        >
          <IndentLeft />
        </button>
        <button
          type="button"
          className={baseClass}
          onClick={(e) => handleIndent(e, 'right')}
        >
          <IndentRight />
        </button>
      </React.Fragment>
    );
  },
  Element: IndentWithPadding,
};

export default indent;
