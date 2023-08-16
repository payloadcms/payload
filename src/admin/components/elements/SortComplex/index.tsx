import React, { useState, useEffect } from 'react';
import queryString from 'qs';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Props } from './types';
import { ReactSelect } from '../ReactSelect';
import sortableFieldTypes from '../../../../fields/sortableFieldTypes';
import { useSearchParams } from '../../utilities/SearchParams';
import { fieldAffectsData, OptionObject } from '../../../../fields/config/types';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const baseClass = 'sort-complex';

const SortComplex: React.FC<Props> = (props) => {
  const {
    collection,
    modifySearchQuery = true,
    handleChange,
  } = props;

  const history = useHistory();
  const params = useSearchParams();
  const { t, i18n } = useTranslation('general');
  const [sortOptions, setSortOptions] = useState<OptionObject[]>();

  const [sortFields] = useState(() => collection.fields.reduce((fields, field) => {
    if (fieldAffectsData(field) && sortableFieldTypes.indexOf(field.type) > -1) {
      return [
        ...fields,
        { label: getTranslation(field.label || field.name, i18n), value: field.name },
      ];
    }
    return fields;
  }, []));

  const [sortField, setSortField] = useState(sortFields[0]);
  const [initialSort] = useState(() => ({ label: t('descending'), value: '-' }));
  const [sortOrder, setSortOrder] = useState(initialSort);

  useEffect(() => {
    if (sortField?.value) {
      const newSortValue = `${sortOrder.value}${sortField.value}`;

      if (handleChange) handleChange(newSortValue);

      if (params.sort !== newSortValue && modifySearchQuery) {
        history.replace({
          search: queryString.stringify({
            ...params,
            sort: newSortValue,
          }, { addQueryPrefix: true }),
        });
      }
    }
  }, [history, params, sortField, sortOrder, modifySearchQuery, handleChange]);

  useEffect(() => {
    setSortOptions([{ label: t('ascending'), value: '' }, { label: t('descending'), value: '-' }]);
  }, [i18n, t]);

  return (
    <div className={baseClass}>
      <React.Fragment>
        <div className={`${baseClass}__wrap`}>
          <div className={`${baseClass}__select`}>
            <div className={`${baseClass}__label`}>
              {t('columnToSort')}
            </div>
            <ReactSelect
              value={sortField}
              options={sortFields}
              onChange={setSortField}
            />
          </div>
          <div className={`${baseClass}__select`}>
            <div className={`${baseClass}__label`}>
              {t('order')}
            </div>
            <ReactSelect
              value={sortOrder}
              options={sortOptions}
              onChange={(incomingSort) => {
                setSortOrder(incomingSort || initialSort);
              }}
            />
          </div>
        </div>
      </React.Fragment>
    </div>
  );
};

export default SortComplex;
