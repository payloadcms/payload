/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import './index.css';

import {$isCodeNode} from '@lexical/code';
import {$getNearestNodeFromDOMNode, LexicalEditor} from 'lexical';
import {Options} from 'prettier';
import * as babelParser from 'prettier/parser-babel';
import * as htmlParser from 'prettier/parser-html';
import * as markdownParser from 'prettier/parser-markdown';
import * as cssParser from 'prettier/parser-postcss';
import {format} from 'prettier/standalone';
import * as React from 'react';
import {useState} from 'react';

interface Props {
  lang: string;
  editor: LexicalEditor;
  getCodeDOMNode: () => HTMLElement | null;
}

const PRETTIER_OPTIONS_BY_LANG: Record<string, Options> = {
  css: {
    parser: 'css',
    plugins: [cssParser],
  },
  html: {
    parser: 'html',
    plugins: [htmlParser],
  },
  js: {
    parser: 'babel',
    plugins: [babelParser],
  },
  markdown: {
    parser: 'markdown',
    plugins: [markdownParser],
  },
};

const LANG_CAN_BE_PRETTIER = Object.keys(PRETTIER_OPTIONS_BY_LANG);

export function canBePrettier(lang: string): boolean {
  return LANG_CAN_BE_PRETTIER.includes(lang);
}

function getPrettierOptions(lang: string): Options {
  const options = PRETTIER_OPTIONS_BY_LANG[lang];
  if (!options) {
    throw new Error(
      `CodeActionMenuPlugin: Prettier does not support this language: ${lang}`,
    );
  }

  return options;
}

export function PrettierButton({lang, editor, getCodeDOMNode}: Props) {
  const [syntaxError, setSyntaxError] = useState<string>('');
  const [tipsVisible, setTipsVisible] = useState<boolean>(false);

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode();

    if (!codeDOMNode) {
      return;
    }

    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);

      if ($isCodeNode(codeNode)) {
        const content = codeNode.getTextContent();
        const options = getPrettierOptions(lang);

        let parsed = '';

        try {
          parsed = format(content, options);
        } catch (error: unknown) {
          if (error instanceof Error) {
            setSyntaxError(error.message);
            setTipsVisible(true);
          } else {
            console.error('Unexpected error: ', error);
          }
        }
        if (parsed !== '') {
          const selection = codeNode.select(0);
          selection.insertText(parsed);
          setSyntaxError('');
          setTipsVisible(false);
        }
      }
    });
  }

  function handleMouseEnter() {
    if (syntaxError !== '') {
      setTipsVisible(true);
    }
  }

  function handleMouseLeave() {
    if (syntaxError !== '') {
      setTipsVisible(false);
    }
  }

  return (
    <div className="prettier-wrapper">
      <button
        className="menu-item"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="prettier">
        {syntaxError ? (
          <i className="format prettier-error" />
        ) : (
          <i className="format prettier" />
        )}
      </button>
      {tipsVisible ? (
        <pre className="code-error-tips">{syntaxError}</pre>
      ) : null}
    </div>
  );
}
