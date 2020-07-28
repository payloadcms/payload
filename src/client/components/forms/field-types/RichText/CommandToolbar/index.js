import React, { useEffect, useState } from 'react';
import { useSlate, useFocused } from 'slate-react';
import { ToolbarElement, ToolbarMark, ToolbarList } from '@udecode/slate-plugins';

import Icons from '../icons';
import { nodeTypes } from '../types';

import './index.scss';

const baseClass = 'command-toolbar';

const CommandToolbar = () => {
  const editor = useSlate();
  const editorFocus = useFocused();
  const [editorFocusedSelection, setEditorFocusedSelection] = useState(editorFocus);

  useEffect(() => {
    if (editorFocus && editor.selection) {
      setEditorFocusedSelection(editor.selection);
    }
  }, [editorFocus, editorFocusedSelection, editor.selection]);

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__elements toggle-section`}>
        <ToolbarElement
          type={nodeTypes.typeH1}
          icon={<Icons.H1 />}
        />

        <ToolbarElement
          type={nodeTypes.typeH2}
          icon={<Icons.H2 />}
        />

        <ToolbarElement
          type={nodeTypes.typeH3}
          icon={<Icons.H3 />}
        />

        <ToolbarElement
          type={nodeTypes.typeH4}
          icon={<Icons.H4 />}
        />

        <ToolbarElement
          type={nodeTypes.typeH5}
          icon={<Icons.H5 />}
        />

        <ToolbarElement
          type={nodeTypes.typeH6}
          icon={<Icons.H6 />}
        />

        <ToolbarElement
          type={nodeTypes.typeCodeBlock}
          icon={<Icons.CodeBlock />}
        />

        <ToolbarElement
          type={nodeTypes.typeBlockquote}
          icon={<Icons.Blockquote />}
        />
      </div>

      <div className={`${baseClass}__marks toggle-section`}>
        <ToolbarMark
          type={nodeTypes.typeCode}
          icon={<Icons.Code />}
        />

        <ToolbarMark
          type={nodeTypes.typeBold}
          icon={<Icons.Bold />}
        />

        <ToolbarMark
          type={nodeTypes.typeItalic}
          icon={<Icons.Italic />}
        />

        <ToolbarMark
          type={nodeTypes.typeUnderline}
          icon={<Icons.Underline />}
        />

        <ToolbarMark
          type={nodeTypes.typeStrikethrough}
          icon={<Icons.Strikethrough />}
        />
      </div>

      <div className={`${baseClass}__lists toggle-section`}>
        <ToolbarList
          {...nodeTypes}
          typeList={nodeTypes.typeUl}
          icon={<Icons.UnorderedList />}
        />

        <ToolbarList
          {...nodeTypes}
          typeList={nodeTypes.typeOl}
          icon={<Icons.OrderedList />}
        />
      </div>
    </div>
  );
};

CommandToolbar.defaultProps = {};

CommandToolbar.propTypes = {};

export default CommandToolbar;
