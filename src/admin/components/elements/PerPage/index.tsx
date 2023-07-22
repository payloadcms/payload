import React from 'react';
import qs from 'qs';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from '../../utilities/SearchParams';
import Popup from '../Popup';
import Chevron from '../../icons/Chevron';
import { defaults } from '../../../../collections/config/defaults';

import './index.scss';

const baseClass = 'per-page';

const defaultLimits = defaults.admin.pagination.limits;

export type Props = {
  limits: number[]
  limit: number
  handleChange?: (limit: number) => void
  modifySearchParams?: boolean
  resetPage?: boolean
}

const PerPage: React.FC<Props> = ({ limits = defaultLimits, limit, handleChange, modifySearchParams = true, resetPage = false }) => {
  const params = useSearchParams();
  const history = useHistory();
  const { t } = useTranslation('general');

  return (
    <div className={baseClass}>
      <Popup
        horizontalAlign="right"
        button={(
          <strong>
            {t('perPage', { limit })}
            <Chevron />
          </strong>
        )}
        render={({ close }) => (
          <div>
            <ul>
              {limits.map((limitNumber, i) => (
                <li
                  className={`${baseClass}-item`}
                  key={i}
                >
                  <button
                    type="button"
                    className={[
                      `${baseClass}__button`,
                      limitNumber === Number(limit) && `${baseClass}__button-active`,
                    ].filter(Boolean).join(' ')}
                    onClick={() => {
                      close();
                      if (handleChange) handleChange(limitNumber);
                      if (modifySearchParams) {
                        history.replace({
                          search: qs.stringify({
                            ...params,
                            page: resetPage ? 1 : params.page,
                            limit: limitNumber,
                          }, { addQueryPrefix: true }),
                        });
                      }
                    }}
                  >
                    {limitNumber === Number(limit) && (
                      <Chevron />
                    )}
                    {limitNumber}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      />
    </div>
  );
};

export default PerPage;
