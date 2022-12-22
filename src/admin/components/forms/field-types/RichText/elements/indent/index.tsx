import React, { useCallback } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, Element, Text, Transforms } from 'slate';
import IndentLeft from '../../../../../icons/IndentLeft';
import IndentRight from '../../../../../icons/IndentRight';
import { baseClass } from '../Button';
import isElementActive from '../isActive';

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
        // Transforms.unwrapNodes(editor, {
        //   match: (n) => Element.isElement(n) && [indentType, ...listTypes].includes(n.type),
        //   split: true,
        //   mode: 'lowest',
        // });

        // if (isElementActive(editor, 'li')) {
        //   const [, parentLocation] = Editor.parent(editor, editor.selection);
        //   const [, parentDepth] = parentLocation;

        //   if (parentDepth > 0 || parentDepth === 0) {
        //     Transforms.unwrapNodes(editor, {
        //       match: (n) => Element.isElement(n) && n.type === 'li',
        //       split: true,
        //       mode: 'lowest',
        //     });
        //   } else {
        //     Transforms.unsetNodes(editor, ['type']);
        //   }
        // }

        const [previousNode, previousNodePath] = Editor.parent(editor, editor.selection, { depth: 4 });

        console.log({ previousNode, previousNodePath });
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
