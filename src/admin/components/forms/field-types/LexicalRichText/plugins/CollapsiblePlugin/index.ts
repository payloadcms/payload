/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './Collapsible.css';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$findMatchingParent, mergeRegister} from '@lexical/utils';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getPreviousSelection,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DELETE_CHARACTER_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  NodeKey,
} from 'lexical';
import {useEffect} from 'react';

import {
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from './CollapsibleContainerNode';
import {
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from './CollapsibleContentNode';
import {
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
} from './CollapsibleTitleNode';

export const INSERT_COLLAPSIBLE_COMMAND = createCommand<void>();
export const TOGGLE_COLLAPSIBLE_COMMAND = createCommand<NodeKey>();

export default function CollapsiblePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (
      !editor.hasNodes([
        CollapsibleContainerNode,
        CollapsibleTitleNode,
        CollapsibleContentNode,
      ])
    ) {
      throw new Error(
        'CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor',
      );
    }

    return mergeRegister(
      // Structure enforcing transformers for each node type. In case nesting structure is not
      // "Container > Title + Content" it'll unwrap nodes and convert it back
      // to regular content.
      editor.registerNodeTransform(CollapsibleContentNode, (node) => {
        const parent = node.getParent();
        if (!$isCollapsibleContainerNode(parent)) {
          const children = node.getChildren();
          for (const child of children) {
            node.insertAfter(child);
          }
          node.remove();
        }
      }),
      editor.registerNodeTransform(CollapsibleTitleNode, (node) => {
        const parent = node.getParent();
        if (!$isCollapsibleContainerNode(parent)) {
          node.replace($createParagraphNode().append(...node.getChildren()));
        }
      }),
      editor.registerNodeTransform(CollapsibleContainerNode, (node) => {
        const children = node.getChildren();
        if (
          children.length !== 2 ||
          !$isCollapsibleTitleNode(children[0]) ||
          !$isCollapsibleContentNode(children[1])
        ) {
          for (const child of children) {
            node.insertAfter(child);
          }
          node.remove();
        }
      }),
      // This handles the case when container is collapsed and we delete its previous sibling
      // into it, it would cause collapsed content deleted (since it's display: none, and selection
      // swallows it when deletes single char). Instead we expand container, which is although
      // not perfect, but avoids bigger problem
      editor.registerCommand(
        DELETE_CHARACTER_COMMAND,
        () => {
          const selection = $getSelection();
          if (
            !$isRangeSelection(selection) ||
            !selection.isCollapsed() ||
            selection.anchor.offset !== 0
          ) {
            return false;
          }

          const anchorNode = selection.anchor.getNode();
          const topLevelElement = anchorNode.getTopLevelElement();
          if (topLevelElement === null) {
            return false;
          }

          const container = topLevelElement.getPreviousSibling();
          if (!$isCollapsibleContainerNode(container) || container.getOpen()) {
            return false;
          }

          container.setOpen(true);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      // When collapsible is the last child pressing down arrow will insert paragraph
      // below it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if trailing paragraph is accidentally deleted
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const container = $findMatchingParent(
            selection.anchor.getNode(),
            $isCollapsibleContainerNode,
          );

          if (container === null) {
            return false;
          }

          const parent = container.getParent();
          if (parent !== null && parent.getLastChild() === container) {
            parent.append($createParagraphNode());
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Handling CMD+Enter to toggle collapsible element collapsed state
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          // @ts-ignore
          const windowEvent: KeyboardEvent | undefined = editor._window?.event;

          if (
            windowEvent &&
            (windowEvent.ctrlKey || windowEvent.metaKey) &&
            windowEvent.key === 'Enter'
          ) {
            const selection = $getPreviousSelection();
            if ($isRangeSelection(selection) && selection.isCollapsed()) {
              const parent = $findMatchingParent(
                selection.anchor.getNode(),
                (node) => $isElementNode(node) && !node.isInline(),
              );

              if ($isCollapsibleTitleNode(parent)) {
                const container = parent.getParent();
                if ($isCollapsibleContainerNode(container)) {
                  container.toggleOpen();
                  $setSelection(selection.clone());
                  return true;
                }
              }
            }
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection();

            if (!$isRangeSelection(selection)) {
              return;
            }

            const title = $createCollapsibleTitleNode();
            const content = $createCollapsibleContentNode().append(
              $createParagraphNode(),
            );
            const container = $createCollapsibleContainerNode().append(
              title,
              content,
            );
            selection.insertNodes([container]);
            title.selectStart();
          });

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        TOGGLE_COLLAPSIBLE_COMMAND,
        (key: NodeKey) => {
          editor.update(() => {
            const containerNode = $getNodeByKey(key);
            if ($isCollapsibleContainerNode(containerNode)) {
              containerNode.toggleOpen();
            }
          });

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);
  return null;
}
