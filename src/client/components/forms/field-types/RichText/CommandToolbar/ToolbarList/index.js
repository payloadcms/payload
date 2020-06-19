import React from 'react';
import PropTypes from 'prop-types';
import { useSlate } from 'slate-react';
import {
  getPreventDefaultHandler,
  ToolbarElement,
  toggleList,
} from '@udecode/slate-plugins';

import { nodeTypes } from '../../types';

const ToolbarList = (props) => {
  const { typeList } = props;
  // const editor = useSlate();
  console.log('render');

  return null;
  return (
    <ToolbarElement
      type={typeList}
      onMouseDown={getPreventDefaultHandler(toggleList, editor, {
        ...props,
        typeList,
      })}
      {...props}
    />
  );
};

ToolbarList.defaultProps = {
  typeList: nodeTypes.UL,
};

ToolbarList.propTypes = {
  typeList: PropTypes.string,
};

export default ToolbarList;
