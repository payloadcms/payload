import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Transforms } from 'slate';
import { useSlate, useFocused } from 'slate-react';
import {
  StrikethroughIcon, BlockquoteIcon, OrderedListIcon, UnorderedListIcon, ItalicIcon, UnderlineIcon, CodeIcon,
} from '../icons';

import { nodeTypes, headingTypes } from '../types';
import CommandButton from '../CommandButton';
import ReactSelect from '../../../../elements/ReactSelect';

import './index.scss';
import BoldIcon from '../icons/Bold';

const baseClass = 'command-toolbar';

const enabledHeadings = [{ label: 'Normal Text', value: 'p' }];

const CommandToolbar = (props) => {
  const { enabledPluginList, maxHeadingLevel, disabledMarks } = props;
  const editor = useSlate();
  const editorFocus = useFocused();
  const [editorFocusedSelection, setEditorFocusedSelection] = useState(editorFocus);
  const headingsAreEnabled = enabledPluginList.heading !== undefined;
  const blockquoteIsEnabled = enabledPluginList.blockquote !== undefined;

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
        {headingsAreEnabled && (
          <ReactSelect
            options={enabledHeadings}
            onChange={onHeadingSelectChange}
          />
        )}

        {blockquoteIsEnabled && (
          <CommandButton element={nodeTypes.typeBlockquote}>
            <BlockquoteIcon />
          </CommandButton>
        )}

        {!disabledMarks.includes(nodeTypes.typeOl) && (
          <CommandButton listElement={nodeTypes.typeOl}>
            <OrderedListIcon />
          </CommandButton>
        )}


        {!disabledMarks.includes(nodeTypes.typeUl) && (
          <CommandButton listElement={nodeTypes.typeUl}>
            <UnorderedListIcon />
          </CommandButton>
        )}

        {!disabledMarks.includes(nodeTypes.typeBold) && (
          <CommandButton mark={nodeTypes.typeBold}>
            <BoldIcon />
          </CommandButton>
        )}

        {!disabledMarks.includes(nodeTypes.typeItalic) && (
          <CommandButton mark={nodeTypes.typeItalic}>
            <ItalicIcon />
          </CommandButton>
        )}

        {!disabledMarks.includes(nodeTypes.typeUnderline) && (
          <CommandButton mark={nodeTypes.typeUnderline}>
            <UnderlineIcon />
          </CommandButton>
        )}

        {!disabledMarks.includes(nodeTypes.typeStrikethrough) && (
          <CommandButton mark={nodeTypes.typeStrikethrough}>
            <StrikethroughIcon />
          </CommandButton>
        )}

        {!disabledMarks.includes(nodeTypes.typeCode) && (
          <CommandButton mark={nodeTypes.typeCode}>
            <CodeIcon />
          </CommandButton>
        )}

        <CommandButton clearStyles>X</CommandButton>
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
