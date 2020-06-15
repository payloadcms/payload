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
  const { typeList, ...rest } = props;
  const editor = useSlate();

  return (
    <ToolbarElement
      type={typeList}
      onMouseDown={getPreventDefaultHandler(toggleList, editor, {
        ...rest,
        typeList,
      })}
      {...rest}
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
