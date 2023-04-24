import React, { useCallback } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, Element, Text, Transforms } from 'slate';
import IndentLeft from '../../../../../icons/IndentLeft';
import IndentRight from '../../../../../icons/IndentRight';
import { baseClass } from '../Button';
import isElementActive from '../isActive';
import listTypes from '../listTypes';
import { getCommonBlock } from '../getCommonBlock';
import { unwrapList } from '../unwrapList';
import { ElementNode } from '../../types';

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
        if (isElementActive(editor, 'li')) {
          const [, listPath] = getCommonBlock(editor, (n) => Element.isElement(n) && listTypes.includes(n.type));

          const matchedParentList = Editor.above(editor, {
            at: listPath,
            match: (n: ElementNode) => !Editor.isEditor(n) && Editor.isBlock(editor, n),
          });

          if (matchedParentList) {
            const [parentListItem, parentListItemPath] = matchedParentList;

            if (parentListItem.children.length > 1) {
              // Remove nested list
              Transforms.unwrapNodes(editor, {
                at: parentListItemPath,
                match: (node, path) => {
                  const matches = !Editor.isEditor(node)
                    && Element.isElement(node)
                    && listTypes.includes(node.type)
                    && path.length === parentListItemPath.length + 1;

                  return matches;
                },
              });

              // Set li type on any children that don't have a type
              Transforms.setNodes(editor, { type: 'li' }, {
                at: parentListItemPath,
                match: (node, path) => {
                  const matches = !Editor.isEditor(node)
                    && Element.isElement(node)
                    && node.type !== 'li'
                    && path.length === parentListItemPath.length + 1;

                  return matches;
                },
              });

              // Parent list item path has changed at this point
              // so we need to re-fetch the parent node
              const [newParentNode] = Editor.node(editor, parentListItemPath);

              // If the parent node is an li,
              // lift all li nodes within
              if (Element.isElement(newParentNode) && newParentNode.type === 'li') {
                // Lift the nested lis
                Transforms.liftNodes(editor, {
                  at: parentListItemPath,
                  match: (node, path) => {
                    const matches = !Editor.isEditor(node)
                      && Element.isElement(node)
                      && path.length === parentListItemPath.length + 1
                      && node.type === 'li';

                    return matches;
                  },
                });
              }
            } else {
              Transforms.unwrapNodes(editor, {
                at: parentListItemPath,
                match: (node, path) => {
                  return Element.isElement(node)
                    && node.type === 'li'
                    && path.length === parentListItemPath.length;
                },
              });

              Transforms.unwrapNodes(editor, {
                match: (n) => Element.isElement(n) && listTypes.includes(n.type),
              });
            }
          } else {
            unwrapList(editor, listPath);
          }
        } else {
          Transforms.unwrapNodes(editor, {
            match: (n) => Element.isElement(n) && n.type === indentType,
            split: true,
            mode: 'lowest',
          });
        }
      }

      if (dir === 'right') {
        const isCurrentlyOL = isElementActive(editor, 'ol');
        const isCurrentlyUL = isElementActive(editor, 'ul');

        if (isCurrentlyOL || isCurrentlyUL) {
          // Get the path of the first selected li -
          // Multiple lis could be selected
          // and the selection may start in the middle of the first li
          const [[, firstSelectedLIPath]] = Array.from(Editor.nodes(editor, {
            mode: 'lowest',
            match: (node) => Element.isElement(node) && node.type === 'li',
          }));

          // Is the first selected li the first in its list?
          const hasPrecedingLI = firstSelectedLIPath[firstSelectedLIPath.length - 1] > 0;

          // If the first selected li is NOT the first in its list,
          // we need to inject it into the prior li
          if (hasPrecedingLI) {
            const [, precedingLIPath] = Editor.previous(editor, {
              at: firstSelectedLIPath,
            });

            const [precedingLIChildren] = Editor.node(editor, [...precedingLIPath, 0]);
            const precedingLIChildrenIsText = Text.isText(precedingLIChildren);

            if (precedingLIChildrenIsText) {
              // Wrap the prior li text content so that it can be nested next to a list
              Transforms.wrapNodes(editor, { children: [] }, { at: [...precedingLIPath, 0] });
            }

            // Move the selected lis after the prior li contents
            Transforms.moveNodes(editor, {
              to: [...precedingLIPath, 1],
              match: (node) => Element.isElement(node) && node.type === 'li',
              mode: 'lowest',
            });

            // Wrap the selected lis in a new list
            Transforms.wrapNodes(
              editor,
              {
                type: isCurrentlyOL ? 'ol' : 'ul', children: [],
              },
              {
                match: (node) => Element.isElement(node) && node.type === 'li',
                mode: 'lowest',
              },
            );
          } else {
            // Otherwise, just wrap the node in a list / li
            Transforms.wrapNodes(
              editor,
              {
                type: isCurrentlyOL ? 'ol' : 'ul', children: [{ type: 'li', children: [] }],
              },
              {
                match: (node) => Element.isElement(node) && node.type === 'li',
                mode: 'lowest',
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
