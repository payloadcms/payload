import React from 'react';
import { components, ControlProps } from 'react-select';
import { Option } from '../../../forms/field-types/Relationship/types';

export const Control: React.FC<ControlProps<Option, any>> = (props) => {
  const {
    children,
    innerProps,
    selectProps: {
      selectProps: {
        drawerIsOpen,
      },
    },
  } = props;

  return (
    <components.Control
      {...props}
      innerProps={{
        ...innerProps,
        onMouseDown: (e) => {
          // prevent react-select from hijacking the onMouseDown event while the drawer is open
          if (!drawerIsOpen) {
            innerProps.onMouseDown(e);
          }
        },
        // react-select has this typed incorrectly
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        onKeyDown: (e) => {
          if (drawerIsOpen) {
            e.stopPropagation();
          }
        },
      }}
    >
      {children}
    </components.Control>
  );
};
