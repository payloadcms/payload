/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import * as React from 'react';

import { SettingsContext, useSettings } from './context/SettingsContext';
import { SharedAutocompleteContext } from './context/SharedAutocompleteContext';
import { SharedHistoryContext } from './context/SharedHistoryContext';
import { Editor } from './LexicalRichText';
import PlaygroundNodes from './nodes/PlaygroundNodes';
import PasteLogPlugin from './plugins/PasteLogPlugin';
import { TableContext } from './plugins/TablePlugin';
import TestRecorderPlugin from './plugins/TestRecorderPlugin';
import TypingPerfPlugin from './plugins/TypingPerfPlugin';
import Settings from './Settings';
import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme';
import { OnChangeProps } from './types';

const LexicalEditor: React.FC<OnChangeProps> = (props) => {
  const {
    onChange,
    initialJSON,
  } = props;

  const {
    settings: { measureTypingPerf },
  } = useSettings();

  const initialConfig = {
    editorState: initialJSON != null ? JSON.stringify(initialJSON) : undefined,
    namespace: 'Playground',
    nodes: [...PlaygroundNodes],
    onError: (error: Error) => {
      throw error;
    },
    theme: PlaygroundEditorTheme,
  };

  // TODO: When should {true ? <PasteLogPlugin /> : null} be enabled? Do we need it?
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <SharedHistoryContext>
        <TableContext>
          <SharedAutocompleteContext>
            <div className="editor-shell">
              <Editor
                onChange={onChange}
                initialJSON={initialJSON}
              />
            </div>
            <Settings />
            {true ? <PasteLogPlugin /> : null}
            {true ? <TestRecorderPlugin /> : null}
            {measureTypingPerf ? <TypingPerfPlugin /> : null}
          </SharedAutocompleteContext>
        </TableContext>
      </SharedHistoryContext>
    </LexicalComposer>
  );
};

export const LexicalEditorComponent: React.FC<OnChangeProps> = (props) => {
  const {
    onChange,
    initialJSON,
  } = props;

  return (
    <SettingsContext>
      <LexicalEditor
        onChange={onChange}
        initialJSON={initialJSON}
      />
    </SettingsContext>
  );
};
