/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $createCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  LexicalTypeaheadMenuPlugin,
  TypeaheadOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $wrapNodes } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  TextNode,
} from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import useModal from '../../hooks/useModal';
import { EmbedConfigs } from '../AutoEmbedPlugin';
import { INSERT_COLLAPSIBLE_COMMAND } from '../CollapsiblePlugin';
import { InsertEquationDialog } from '../EquationsPlugin';
import { INSERT_IMAGE_COMMAND/* , InsertImageDialog */ } from '../UploadPlugin'; //TODO: InsertImageDialog begone! What is ComponentPickerPlugin even used for?
import { InsertTableDialog } from '../TablePlugin';

class ComponentPickerOption extends TypeaheadOption {
  // What shows up in the editor
  title: string;

  // Icon for display
  icon?: JSX.Element;

  // For extra searching.
  keywords: Array<string>;

  // TBD
  keyboardShortcut?: string;

  // What happens when you select this option?
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
    },
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
}

function ComponentPickerMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: ComponentPickerOption;
}) {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={`typeahead-item-${index}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {option.icon}
      <span className="text">{option.title}</span>
    </li>
  );
}

export default function ComponentPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const getDynamicOptions = useCallback(() => {
    const options: Array<ComponentPickerOption> = [];

    if (queryString == null) {
      return options;
    }

    const fullTableRegex = new RegExp(/^([1-9]|10)x([1-9]|10)$/);
    const partialTableRegex = new RegExp(/^([1-9]|10)x?$/);

    const fullTableMatch = fullTableRegex.exec(queryString);
    const partialTableMatch = partialTableRegex.exec(queryString);

    if (fullTableMatch) {
      const [rows, columns] = fullTableMatch[0]
        .split('x')
        .map((n: string) => parseInt(n, 10));

      options.push(
        new ComponentPickerOption(`${rows}x${columns} Table`, {
          icon: <i className="icon table" />,
          keywords: ['table'],
          onSelect: () =>
            // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
        }),
      );
    } else if (partialTableMatch) {
      const rows = parseInt(partialTableMatch[0], 10);

      options.push(
        ...Array.from({ length: 5 }, (_, i) => i + 1).map(
          (columns) => new ComponentPickerOption(`${rows}x${columns} Table`, {
            icon: <i className="icon table" />,
            keywords: ['table'],
            onSelect: () =>
            // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
          }),
        ),
      );
    }

    return options;
  }, [editor, queryString]);

  const options = useMemo(() => {
    const baseOptions = [
      new ComponentPickerOption('Paragraph', {
        icon: <i className="icon paragraph" />,
        keywords: ['normal', 'paragraph', 'p', 'text'],
        onSelect: () => editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $wrapNodes(selection, () => $createParagraphNode());
          }
        }),
      }),
      ...Array.from({ length: 3 }, (_, i) => i + 1).map(
        (n) => new ComponentPickerOption(`Heading ${n}`, {
          icon: <i className={`icon h${n}`} />,
          keywords: ['heading', 'header', `h${n}`],
          onSelect: () => editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $wrapNodes(selection, () =>
              // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
                $createHeadingNode(`h${n}`));
            }
          }),
        }),
      ),
      new ComponentPickerOption('Table', {
        icon: <i className="icon table" />,
        keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
        onSelect: () => showModal('Insert Table', (onClose) => (
          <InsertTableDialog
            activeEditor={editor}
            onClose={onClose}
          />
        )),
      }),
      new ComponentPickerOption('Numbered List', {
        icon: <i className="icon number" />,
        keywords: ['numbered list', 'ordered list', 'ol'],
        onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Bulleted List', {
        icon: <i className="icon bullet" />,
        keywords: ['bulleted list', 'unordered list', 'ul'],
        onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Check List', {
        icon: <i className="icon check" />,
        keywords: ['check list', 'todo list'],
        onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Quote', {
        icon: <i className="icon quote" />,
        keywords: ['block quote'],
        onSelect: () => editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $wrapNodes(selection, () => $createQuoteNode());
          }
        }),
      }),
      new ComponentPickerOption('Code', {
        icon: <i className="icon code" />,
        keywords: ['javascript', 'python', 'js', 'codeblock'],
        onSelect: () => editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            if (selection.isCollapsed()) {
              $wrapNodes(selection, () => $createCodeNode());
            } else {
              // Will this ever happen?
              const textContent = selection.getTextContent();
              const codeNode = $createCodeNode();
              selection.insertNodes([codeNode]);
              selection.insertRawText(textContent);
            }
          }
        }),
      }),
      new ComponentPickerOption('Divider', {
        icon: <i className="icon horizontal-rule" />,
        keywords: ['horizontal rule', 'divider', 'hr'],
        onSelect: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
      }),
      ...EmbedConfigs.map(
        (embedConfig) => new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
          icon: embedConfig.icon,
          keywords: [...embedConfig.keywords, 'embed'],
          onSelect: () => editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
        }),
      ),
      new ComponentPickerOption('Equation', {
        icon: <i className="icon equation" />,
        keywords: ['equation', 'latex', 'math'],
        onSelect: () => showModal('Insert Equation', (onClose) => (
          <InsertEquationDialog
            activeEditor={editor}
            onClose={onClose}
          />
        )),
      }),
      new ComponentPickerOption('Image', {
        icon: <i className="icon image" />,
        keywords: ['image', 'photo', 'picture', 'file'],
        onSelect: () => showModal('Insert Image', (onClose) => (
          /* toggleModal('lexicalRichText-add-upload'); */ //TODO: Same as above
          <p>Todo</p>
        )),
      }),
      new ComponentPickerOption('Collapsible', {
        icon: <i className="icon caret-right" />,
        keywords: ['collapse', 'collapsible', 'toggle'],
        onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
      }),
      ...['left', 'center', 'right', 'justify'].map(
        (alignment) => new ComponentPickerOption(`Align ${alignment}`, {
          icon: <i className={`icon ${alignment}-align`} />,
          keywords: ['align', 'justify', alignment],
          onSelect: () =>
          // @ts-ignore Correct types, but since they're dynamic TS doesn't like it.
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
        }),
      ),
    ];

    const dynamicOptions = getDynamicOptions();

    return queryString
      ? [
        ...dynamicOptions,
        ...baseOptions.filter((option) => {
          return new RegExp(queryString, 'gi').exec(option.title)
              || option.keywords != null
            ? option.keywords.some((keyword) => new RegExp(queryString, 'gi').exec(keyword))
            : false;
        }),
      ]
      : baseOptions;
  }, [editor, getDynamicOptions, queryString, showModal]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <React.Fragment>
      {modal}
      <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
        ) => (anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
            <div className="typeahead-popover component-picker-menu">
              <ul>
                {options.map((option, i: number) => (
                  <ComponentPickerMenuItem
                    index={i}
                    isSelected={selectedIndex === i}
                    onClick={() => {
                      setHighlightedIndex(i);
                      selectOptionAndCleanUp(option);
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(i);
                    }}
                    key={option.key}
                    option={option}
                  />
                ))}
              </ul>
            </div>,
            anchorElementRef.current,
          )
          : null)}
      />
    </React.Fragment>
  );
}
