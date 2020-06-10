import React from 'react';
import PropTypes from 'prop-types';
import { Transforms, Text } from 'slate';
import { useSlate } from 'slate-react';
import {
  toggleMark, toggleList, isMarkActive, isNodeInSelection, getNode,
} from '@udecode/slate-plugins';

import { nodeTypes } from '../types';
import Button from '../../../../elements/Button';

import './index.scss';

const baseClass = 'command-button';

const CommandButton = (props) => {
  const {
    mark, element, listElement, children, clearStyles,
  } = props;
  const editor = useSlate();

  const onClick = () => {
    if (mark) toggleMark(editor, mark);
    if (element) editor.toggleType(element);
    if (listElement) toggleList(editor, { typeList: listElement });
    if (clearStyles) {
      const nodeTypesArray = Object.keys(nodeTypes).reduce((acc, key) => [...acc, nodeTypes[key]], []);

      const node = Transforms.collapse(editor);
      console.log(node);
    }
  };

  const isActive = (mark && isMarkActive(editor, mark)) || (element && isNodeInSelection(editor, element));

  const classes = [
    baseClass,
    isActive && `${baseClass}--is-active`,
  ].filter(Boolean).join(' ');

  return (
    <Button
      className={classes}
      onClick={onClick}
      type="button"
    >
      {children}
    </Button>
  );
};

CommandButton.defaultProps = {
  mark: null,
  element: null,
  listElement: null,
  clearStyles: false,
};

CommandButton.propTypes = {
  mark: PropTypes.string,
  element: PropTypes.string,
  listElement: PropTypes.string,
  children: PropTypes.node.isRequired,
  clearStyles: PropTypes.bool,
};

export default CommandButton;
