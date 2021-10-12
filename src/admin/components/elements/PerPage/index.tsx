import React, { useEffect, useState, useCallback } from 'react';
import qs from 'qs';

import { Link } from 'react-router-dom';
import { useConfig } from '@payloadcms/config-provider';
import { usePreferences } from '../../utilities/Preferences';
import { useSearchParams } from '../../utilities/SearchParams';
import Popup from '../Popup';
import Chevron from '../../icons/Chevron';

import './index.scss';

const baseClass = 'per-page';
type Props = {
  setLimit: (limit: number) => void;
  limit: number;
}

const PerPage: React.FC<Props> = ({ setLimit }) => {
  const { admin: { pagination: { options } } } = useConfig();

  return (
    <div className={baseClass}>
      <Popup
        horizontalAlign="center"
        button={(
          <div>
            Per Page:
            <Chevron />
          </div>
        )}
        backgroundColor="#333333"
        render={({ close }) => (
          <div>
            <ul>
              {options.map((limitNumber, i) => (
                <li
                  className={`${baseClass}-item`}
                  key={i}
                >
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      setLimit(limitNumber);
                    }}
                  >
                    {limitNumber}
                  </button>
                </li>
              ))}
              ;
            </ul>
          </div>
        )}
      />
    </div>
  );
};

export default PerPage;
