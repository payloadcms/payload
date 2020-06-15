import React from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import {
  ToolbarButton,
  isNodeInSelection,
  insertLink,
} from '@udecode/slate-plugins';

import { nodeTypes } from '../../types';

const ToolbarLink = (props) => {
  const { typeLink, ...rest } = props;
  const editor = useSlate();

  return (
    <ToolbarButton
      active={isNodeInSelection(editor, typeLink)}
      onMouseDown={(event) => {
        event.preventDefault();

        const url = window.prompt('Enter the URL of the link:');
        if (!url) return;

        insertLink(editor, url, { typeLink });
      }}
      {...rest}
    />
  );
};

ToolbarLink.defaultProps = {
  typeLink: nodeTypes.UL,
};

ToolbarLink.propTypes = {
  typeLink: PropTypes.string,
};

export default ToolbarLink;
