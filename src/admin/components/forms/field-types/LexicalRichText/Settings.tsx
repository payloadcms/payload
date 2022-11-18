/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as React from 'react';
import { useState } from 'react';

import { useSettings } from './context/SettingsContext';
import Switch from './ui/Switch';

export default function Settings(): JSX.Element {
  const {
    setOption,
    settings: {
      measureTypingPerf,
      isRichText,
      isMaxLength,
      isCharLimit,
      isCharLimitUtf8,
      isAutocomplete,
      showTreeView,
      showNestedEditorTreeView,
      disableBeforeInput,
      showTableOfContents,
    },
  } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <React.Fragment>
      <button
        id="options-button"
        className={`editor-dev-button ${showSettings ? 'active' : ''}`}
        onClick={(event) => {
          event.preventDefault();
          setShowSettings(!showSettings);
        }}
      />
      {showSettings ? (
        <div className="switches">
          <Switch
            onClick={() => setOption('measureTypingPerf', !measureTypingPerf)}
            checked={measureTypingPerf}
            text="Measure Perf"
          />
          <Switch
            onClick={() => setOption('showTreeView', !showTreeView)}
            checked={showTreeView}
            text="Debug View"
          />
          <Switch
            onClick={() => setOption('showNestedEditorTreeView', !showNestedEditorTreeView)}
            checked={showNestedEditorTreeView}
            text="Nested Editors Debug View"
          />
          <Switch
            onClick={() => {
              setOption('isRichText', !isRichText);
            }}
            checked={isRichText}
            text="Rich Text"
          />
          <Switch
            onClick={() => setOption('isCharLimit', !isCharLimit)}
            checked={isCharLimit}
            text="Char Limit"
          />
          <Switch
            onClick={() => setOption('isCharLimitUtf8', !isCharLimitUtf8)}
            checked={isCharLimitUtf8}
            text="Char Limit (UTF-8)"
          />
          <Switch
            onClick={() => setOption('isMaxLength', !isMaxLength)}
            checked={isMaxLength}
            text="Max Length"
          />
          <Switch
            onClick={() => setOption('isAutocomplete', !isAutocomplete)}
            checked={isAutocomplete}
            text="Autocomplete"
          />
          <Switch
            onClick={() => {
              setOption('disableBeforeInput', !disableBeforeInput);
              setTimeout(() => window.location.reload(), 500);
            }}
            checked={disableBeforeInput}
            text="Legacy Events"
          />
          <Switch
            onClick={() => {
              setOption('showTableOfContents', !showTableOfContents);
            }}
            checked={showTableOfContents}
            text="Table Of Contents"
          />
        </div>
      ) : null}
    </React.Fragment>
  );
}
