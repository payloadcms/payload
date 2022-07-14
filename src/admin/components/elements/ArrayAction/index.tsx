import React from 'react';
import Popup from '../Popup';
import More from '../../icons/More';
import Chevron from '../../icons/Chevron';
import { Props } from './types';
import Plus from '../../icons/Plus';
import X from '../../icons/X';
import Copy from '../../icons/Copy';

import './index.scss';

const baseClass = 'array-actions';

export const ArrayAction: React.FC<Props> = ({
  moveRow,
  index,
  rowCount,
  addRow,
  duplicateRow,
  removeRow,
}) => {
  return (
    <Popup
      horizontalAlign="center"
      className={baseClass}
      buttonClassName={`${baseClass}__button`}
      button={<More />}
      render={({ close }) => {
        return (
          <React.Fragment>
            {index !== 0 && (
              <button
                className={`${baseClass}__action ${baseClass}__move-up`}
                type="button"
                onClick={() => {
                  moveRow(index, index - 1);
                  close();
                }}
              >
                <Chevron />
                Move Up
              </button>
            )}
            {index < rowCount - 1 && (
              <button
                className={`${baseClass}__action ${baseClass}__move-down`}
                type="button"
                onClick={() => {
                  moveRow(index, index + 1);
                  close();
                }}
              >
                <Chevron />
                Move Down
              </button>
            )}
            <button
              className={`${baseClass}__action ${baseClass}__add`}
              type="button"
              onClick={() => {
                addRow(index);
                close();
              }}
            >
              <Plus />
              Add Below
            </button>
            <button
              className={`${baseClass}__action ${baseClass}__duplicate`}
              type="button"
              onClick={() => {
                duplicateRow(index);
                close();
              }}
            >
              <Copy />
              Duplicate
            </button>
            <button
              className={`${baseClass}__action ${baseClass}__remove`}
              type="button"
              onClick={() => {
                removeRow(index);
                close();
              }}
            >
              <X />
              Remove
            </button>
          </React.Fragment>
        );
      }}
    />
  );
};
