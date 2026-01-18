'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { formatAdminURL } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { useDebounce } from '../../../../hooks/useDebounce.js';
import { useEffectEvent } from '../../../../hooks/useEffectEvent.js';
import { useConfig } from '../../../../providers/Config/index.js';
import { useLocale } from '../../../../providers/Locale/index.js';
import { useTranslation } from '../../../../providers/Translation/index.js';
import { ReactSelect } from '../../../ReactSelect/index.js';
import './index.scss';
import optionsReducer from './optionsReducer.js';
const baseClass = 'condition-value-relationship';
const maxResultsPerRequest = 10;
export const RelationshipFilter = props => {
  const {
    disabled,
    field: {
      admin = {},
      hasMany,
      relationTo
    },
    filterOptions,
    onChange,
    value
  } = props;
  const placeholder = 'placeholder' in admin ? admin?.placeholder : undefined;
  const isSortable = admin?.isSortable;
  const {
    config: {
      routes: {
        api
      }
    },
    getEntityConfig
  } = useConfig();
  const hasMultipleRelations = Array.isArray(relationTo);
  const [options, dispatchOptions] = useReducer(optionsReducer, []);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [errorLoading, setErrorLoading] = useState('');
  const [hasLoadedFirstOptions, setHasLoadedFirstOptions] = useState(false);
  const {
    i18n,
    t
  } = useTranslation();
  const locale = useLocale();
  const relationSlugs = hasMultipleRelations ? relationTo : [relationTo];
  const loadedRelationships = React.useRef(new Map(relationSlugs.map(relation => [relation, {
    hasLoadedAll: false,
    nextPage: 1
  }])));
  const addOptions = useCallback((data, relation_0) => {
    const collection = getEntityConfig({
      collectionSlug: relation_0
    });
    dispatchOptions({
      type: 'ADD',
      collection,
      data,
      hasMultipleRelations,
      i18n,
      relation: relation_0
    });
  }, [hasMultipleRelations, i18n, getEntityConfig]);
  const loadOptions = useEffectEvent(async ({
    abortController,
    relationSlug
  }) => {
    const loadedRelationship = loadedRelationships.current.get(relationSlug);
    if (relationSlug && !loadedRelationship.hasLoadedAll) {
      const collection_0 = getEntityConfig({
        collectionSlug: relationSlug
      });
      const fieldToSearch = collection_0?.admin?.useAsTitle || 'id';
      const where = {
        and: []
      };
      const query = {
        depth: 0,
        limit: maxResultsPerRequest,
        locale: locale.code,
        page: loadedRelationship.nextPage,
        select: {
          [fieldToSearch]: true
        },
        where
      };
      if (filterOptions && filterOptions?.[relationSlug]) {
        query.where.and.push(filterOptions[relationSlug]);
      }
      if (debouncedSearch) {
        query.where.and.push({
          [fieldToSearch]: {
            like: debouncedSearch
          }
        });
      }
      try {
        const response = await fetch(formatAdminURL({
          apiRoute: api,
          path: `/${relationSlug}${qs.stringify(query, {
            addQueryPrefix: true
          })}`
        }), {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language
          },
          signal: abortController.signal
        });
        if (response.ok) {
          const data_0 = await response.json();
          if (data_0.docs.length > 0) {
            addOptions(data_0, relationSlug);
            if (data_0.nextPage) {
              loadedRelationships.current.set(relationSlug, {
                hasLoadedAll: false,
                nextPage: data_0.nextPage
              });
            } else {
              loadedRelationships.current.set(relationSlug, {
                hasLoadedAll: true,
                nextPage: null
              });
            }
          }
        } else {
          setErrorLoading(t('error:unspecific'));
        }
      } catch (e) {
        if (!abortController.signal.aborted) {
          console.error(e); // eslint-disable-line no-console
        }
      }
    }
    setHasLoadedFirstOptions(true);
  });
  const handleScrollToBottom = React.useCallback(() => {
    const relationshipToLoad = loadedRelationships.current.entries().next().value;
    if (relationshipToLoad[0] && !relationshipToLoad[1].hasLoadedAll) {
      const abortController_0 = new AbortController();
      void loadOptions({
        abortController: abortController_0,
        relationSlug: relationshipToLoad[0]
      });
    }
  }, []);
  const findOptionsByValue = useCallback(() => {
    if (value) {
      if (hasMany) {
        if (Array.isArray(value)) {
          return value.map(val => {
            if (hasMultipleRelations) {
              let matchedOption;
              options.forEach(opt => {
                if (opt.options) {
                  opt.options.some(subOpt => {
                    if (subOpt?.value == val.value) {
                      matchedOption = subOpt;
                      return true;
                    }
                    return false;
                  });
                }
              });
              return matchedOption;
            }
            return options.find(opt_0 => opt_0.value == val);
          });
        }
        return undefined;
      }
      if (hasMultipleRelations) {
        let matchedOption_0;
        const valueWithRelation = value;
        options.forEach(opt_1 => {
          if (opt_1?.options) {
            opt_1.options.some(subOpt_0 => {
              if (subOpt_0?.value == valueWithRelation.value) {
                matchedOption_0 = subOpt_0;
                return true;
              }
              return false;
            });
          }
        });
        return matchedOption_0;
      }
      return options.find(opt_2 => opt_2.value == value);
    }
    return undefined;
  }, [hasMany, hasMultipleRelations, value, options]);
  const handleInputChange = useCallback(input => {
    if (input !== search) {
      dispatchOptions({
        type: 'CLEAR',
        i18n,
        required: false
      });
      const relationSlugs_0 = Array.isArray(relationTo) ? relationTo : [relationTo];
      loadedRelationships.current = new Map(relationSlugs_0.map(relation_1 => [relation_1, {
        hasLoadedAll: false,
        nextPage: 1
      }]));
      setSearch(input);
    }
  }, [i18n, relationTo, search]);
  const addOptionByID = useCallback(async (id, relation_2) => {
    if (!errorLoading && id !== 'null' && id && relation_2) {
      const response_0 = await fetch(formatAdminURL({
        apiRoute: api,
        path: `/${relation_2}/${id}?depth=0`
      }), {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language
        }
      });
      if (response_0.ok) {
        const data_1 = await response_0.json();
        addOptions({
          docs: [data_1]
        }, relation_2);
      } else {
        // eslint-disable-next-line no-console
        console.error(t('error:loadingDocument', {
          id
        }));
      }
    }
  }, [i18n, addOptions, api, errorLoading, t]);
  /**
  * When `relationTo` changes externally, reset the options and reload them from scratch
  * The `loadOptions` dependency is a useEffectEvent which has no dependencies of its own
  * This means we can safely depend on it without it triggering this effect to run
  * This is useful because this effect should _only_ run when `relationTo` changes
  */
  useEffect(() => {
    const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
    loadedRelationships.current = new Map(relations.map(relation_3 => [relation_3, {
      hasLoadedAll: false,
      nextPage: 1
    }]));
    dispatchOptions({
      type: 'CLEAR',
      i18n,
      required: false
    });
    setHasLoadedFirstOptions(false);
    const abortControllers = [];
    relations.forEach(relation_4 => {
      const abortController_1 = new AbortController();
      void loadOptions({
        abortController: abortController_1,
        relationSlug: relation_4
      });
      abortControllers.push(abortController_1);
    });
    return () => {
      abortControllers.forEach(controller => {
        if (controller.signal) {
          try {
            controller.abort();
          } catch (_err) {
            // swallow error
          }
        }
      });
    };
  }, [i18n, relationTo, debouncedSearch, filterOptions]);
  /**
  * Load any other options that might exist in the value that were not loaded already
  */
  useEffect(() => {
    if (value && hasLoadedFirstOptions) {
      if (hasMany) {
        const matchedOptions = findOptionsByValue();
        (matchedOptions || []).forEach((option, i) => {
          if (!option) {
            if (hasMultipleRelations) {
              void addOptionByID(value[i].value, value[i].relationTo);
            } else {
              void addOptionByID(value[i], relationTo);
            }
          }
        });
      } else {
        const matchedOption_1 = findOptionsByValue();
        if (!matchedOption_1) {
          if (hasMultipleRelations) {
            const valueWithRelation_0 = value;
            void addOptionByID(valueWithRelation_0.value, valueWithRelation_0.relationTo);
          } else {
            void addOptionByID(value, relationTo);
          }
        }
      }
    }
  }, [addOptionByID, findOptionsByValue, hasMany, hasMultipleRelations, relationTo, value, hasLoadedFirstOptions]);
  const classes = ['field-type', baseClass, errorLoading && 'error-loading'].filter(Boolean).join(' ');
  const valueToRender = findOptionsByValue() || value;
  return /*#__PURE__*/_jsx("div", {
    className: classes,
    children: errorLoading ? /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__error-loading`,
      children: errorLoading
    }) : /*#__PURE__*/_jsx(ReactSelect, {
      disabled: disabled,
      isMulti: hasMany,
      isSortable: isSortable,
      onChange: selected => {
        if (!selected) {
          onChange(null);
          return;
        }
        if (hasMany && Array.isArray(selected)) {
          onChange(selected ? selected.map(option_0 => {
            if (hasMultipleRelations) {
              return {
                relationTo: option_0?.relationTo,
                value: option_0?.value
              };
            }
            return option_0?.value;
          }) : null);
        } else if (hasMultipleRelations && !Array.isArray(selected)) {
          onChange({
            relationTo: selected?.relationTo,
            value: selected?.value
          });
        } else if (!Array.isArray(selected)) {
          onChange(selected?.value);
        }
      },
      onInputChange: handleInputChange,
      onMenuScrollToBottom: handleScrollToBottom,
      options: options,
      placeholder: placeholder,
      value: valueToRender
    })
  });
};
//# sourceMappingURL=index.js.map