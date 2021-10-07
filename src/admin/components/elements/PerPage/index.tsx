import React from 'react';

import './index.scss';
import { Link } from 'react-router-dom';
import Popup from '../Popup';
import Chevron from '../../icons/Chevron';

const baseClass = 'per-page';
type Props = {
  valueOptions: number[];
}

const PerPage: React.FC<Props> = ({ valueOptions }) => (
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
            {valueOptions.map((option, i) => (
              <li
                className={`${baseClass}-item`}
                key={i}
              >
                <Link
                  to="/asdf"
                  onClick={close}
                >
                  {option}
                </Link>

              </li>
            ))}

          </ul>
        </div>
      )}
    />
  </div>
);

export default PerPage;
