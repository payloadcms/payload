import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Transforms } from 'slate';
import { useSlate, useFocused } from 'slate-react';
import { ToolbarElement, ToolbarMark, ToolbarList } from '@udecode/slate-plugins';

import { nodeTypes, headingTypes } from '../types';
import Icons from '../icons';

import './index.scss';

const baseClass = 'command-toolbar';

const enabledHeadings = [{ label: 'Normal Text', value: 'p' }];

const CommandToolbar = (props) => {
  const { enabledPluginList, maxHeadingLevel, disabledMarks } = props;
  const editor = useSlate();
  const editorFocus = useFocused();
  const [editorFocusedSelection, setEditorFocusedSelection] = useState(editorFocus);
  const headingsAreEnabled = enabledPluginList?.heading;
  const blockquoteIsEnabled = enabledPluginList?.blockquote;

  const onHeadingSelectChange = (headingType) => {
    if (editorFocusedSelection) {
      Transforms.select(editor, editorFocusedSelection);
      editor.toggleType(headingType);
    }
  };

  useEffect(() => {
    if (editorFocus && editor.selection) setEditorFocusedSelection(editor.selection);
  }, [editorFocus, editorFocusedSelection, editor.selection]);

  useEffect(() => {
    if (headingsAreEnabled) {
      Array.from(Array(maxHeadingLevel)).forEach((_, index) => {
        enabledHeadings.push({
          label: `Heading ${index + 1}`,
          value: headingTypes[index],
        });
      });
    }
  }, [headingsAreEnabled, maxHeadingLevel]);

  return (
    <div className={baseClass}>

      <div className={`${baseClass}__toggles`}>

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
          type={nodeTypes.typeBlockquote}
          icon={<Icons.Blockquote />}
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

CommandToolbar.defaultProps = {
  maxHeadingLevel: 6,
  enabledPluginList: {},
  disabledMarks: [],
};

CommandToolbar.propTypes = {
  maxHeadingLevel: PropTypes.number,
  enabledPluginList: PropTypes.shape({
    heading: PropTypes.string,
    blockquote: PropTypes.string,
  }),
  disabledMarks: PropTypes.arrayOf(PropTypes.string),
};

export default CommandToolbar;
