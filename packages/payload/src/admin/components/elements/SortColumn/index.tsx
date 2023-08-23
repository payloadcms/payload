import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'qs';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import Chevron from '../../icons/Chevron';
import Button from '../Button';
import { useSearchParams } from '../../utilities/SearchParams';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'sort-column';

const SortColumn: React.FC<Props> = (props) => {
  const {
    label, name, disable = false,
  } = props;
  const params = useSearchParams();
  const history = useHistory();
  const { t, i18n } = useTranslation('general');

  const { sort } = params;

  const desc = `-${name}`;
  const asc = name;

  const ascClasses = [`${baseClass}__asc`];
  if (sort === asc) ascClasses.push(`${baseClass}--active`);

  const descClasses = [`${baseClass}__desc`];
  if (sort === desc) descClasses.push(`${baseClass}--active`);

  const setSort = useCallback((newSort) => {
    history.push({
      search: queryString.stringify({
        ...params,
        sort: newSort,
      }, { addQueryPrefix: true }),
    });
  }, [params, history]);

  return (
    <div className={baseClass}>
      <span className={`${baseClass}__label`}>{getTranslation(label, i18n)}</span>
      {!disable && (
        <span className={`${baseClass}__buttons`}>
          <Button
            round
            buttonStyle="none"
            className={ascClasses.join(' ')}
            onClick={() => setSort(asc)}
            aria-label={t('sortByLabelDirection', { label: getTranslation(label, i18n), direction: t('ascending') })}
          >
            <Chevron />
          </Button>
          <Button
            round
            buttonStyle="none"
            className={descClasses.join(' ')}
            onClick={() => setSort(desc)}
            aria-label={t('sortByLabelDirection', { label: getTranslation(label, i18n), direction: t('descending') })}
          >
            <Chevron />
          </Button>
        </span>
      )}
    </div>
  );
};

export default SortColumn;
