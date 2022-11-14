import React from 'react';
import { Props, isComponent } from './types';
import { useWatchForm } from '../Form/context';

const RowHeader: React.FC<Props> = (props) => {
  const {
    path,
    fallback,
    header,
    rowNumber,
  } = props;
  const { getSiblingData } = useWatchForm();
  const siblingData = getSiblingData(`${path}`);

  if (isComponent(header)) {
    const Header = header;
    return (
      <Header
        value={siblingData}
        index={rowNumber}
      />
    );
  }

  if (header) {
    return (
      <React.Fragment>
        {
          typeof header === 'function'
            ? header({ value: siblingData, index: rowNumber })
            : header
        }
      </React.Fragment>
    );
  }

  return fallback;
};

export default RowHeader;
