'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { dequal } from 'dequal/lite';
import { formatAdminURL, wordBoundariesRegex } from 'payload/shared';
import * as qs from 'qs-esm';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AddNewRelation } from '../../elements/AddNewRelation/index.js';
import { useDocumentDrawer } from '../../elements/DocumentDrawer/index.js';
import { useListDrawer } from '../../elements/ListDrawer/index.js';
import { ReactSelect } from '../../elements/ReactSelect/index.js';
import { RenderCustomComponent } from '../../elements/RenderCustomComponent/index.js';
import { FieldDescription } from '../../fields/FieldDescription/index.js';
import { FieldError } from '../../fields/FieldError/index.js';
import { FieldLabel } from '../../fields/FieldLabel/index.js';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback.js';
import { useEffectEvent } from '../../hooks/useEffectEvent.js';
import { useQueue } from '../../hooks/useQueue.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useConfig } from '../../providers/Config/index.js';
import { useDocumentEvents } from '../../providers/DocumentEvents/index.js';
import { useLocale } from '../../providers/Locale/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import { sanitizeFilterOptionsQuery } from '../../utilities/sanitizeFilterOptionsQuery.js';
import { fieldBaseClass } from '../shared/index.js';
import { createRelationMap } from './createRelationMap.js';
import { findOptionsByValue } from './findOptionsByValue.js';
import { optionsReducer } from './optionsReducer.js';
import './index.scss';
import { MultiValueLabel } from './select-components/MultiValueLabel/index.js';
import { SingleValue } from './select-components/SingleValue/index.js';
const baseClass = 'relationship';
export const RelationshipInput = props => {
  const {
    AfterInput,
    allowCreate = true,
    allowEdit = true,
    appearance = 'select',
    BeforeInput,
    className,
    description,
    Description,
    Error,
    filterOptions,
    formatDisplayedOptions,
    hasMany,
    initialValue,
    isSortable = true,
    label,
    Label,
    localized,
    maxResultsPerRequest = 10,
    onChange,
    path,
    placeholder,
    readOnly,
    relationTo,
    required,
    showError,
    sortOptions,
    style,
    value
  } = props;
  const {
    config,
    getEntityConfig
  } = useConfig();
  const {
    routes: {
      api
    },
    serverURL
  } = config;
  const {
    i18n,
    t
  } = useTranslation();
  const {
    permissions
  } = useAuth();
  const {
    code: locale
  } = useLocale();
  const [currentlyOpenRelationship, setCurrentlyOpenRelationship] = useState({
    id: undefined,
    collectionSlug: undefined,
    hasReadPermission: false
  });
  const [lastFullyLoadedRelation, setLastFullyLoadedRelation] = useState(-1);
  const [lastLoadedPage, setLastLoadedPage] = useState({});
  const [errorLoading, setErrorLoading] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableWordBoundarySearch, setEnableWordBoundarySearch] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const hasLoadedFirstPageRef = useRef(false);
  const {
    queueTask
  } = useQueue();
  const [options, dispatchOptions] = useReducer(optionsReducer, []);
  const valueRef = useRef(value);
  const [DocumentDrawer,, {
    drawerSlug,
    isDrawerOpen,
    openDrawer
  }] = useDocumentDrawer({
    id: currentlyOpenRelationship.id,
    collectionSlug: currentlyOpenRelationship.collectionSlug
  });
  // Filter selected values from displaying in the list drawer
  const listDrawerFilterOptions = useMemo(() => {
    let newFilterOptions = filterOptions;
    if (value) {
      const valuesByRelation = (hasMany === false ? [value] : value).reduce((acc, val) => {
        if (!acc[val.relationTo]) {
          acc[val.relationTo] = [];
        }
        acc[val.relationTo].push(val.value);
        return acc;
      }, {});
      (Array.isArray(relationTo) ? relationTo : [relationTo]).forEach(relation => {
        newFilterOptions = {
          ...(newFilterOptions || {}),
          [relation]: {
            ...(typeof filterOptions?.[relation] === 'object' ? filterOptions[relation] : {}),
            ...(valuesByRelation[relation] ? {
              id: {
                not_in: valuesByRelation[relation]
              }
            } : {})
          }
        };
      });
    }
    return newFilterOptions;
  }, [filterOptions, value, hasMany, relationTo]);
  const [ListDrawer,, {
    closeDrawer: closeListDrawer,
    isDrawerOpen: isListDrawerOpen,
    openDrawer: openListDrawer
  }] = useListDrawer({
    collectionSlugs: relationTo,
    filterOptions: listDrawerFilterOptions
  });
  const onListSelect = useCallback(({
    collectionSlug,
    doc
  }) => {
    if (hasMany) {
      onChange([...(Array.isArray(value) ? value : []), {
        relationTo: collectionSlug,
        value: doc.id
      }]);
    } else if (hasMany === false) {
      onChange({
        relationTo: collectionSlug,
        value: doc.id
      });
    }
    closeListDrawer();
  }, [hasMany, onChange, closeListDrawer, value]);
  const openDrawerWhenRelationChanges = useRef(false);
  const updateResults = useCallback(({
    filterOptions: filterOptions_0,
    hasMany: hasManyArg,
    lastFullyLoadedRelation: lastFullyLoadedRelationArg,
    lastLoadedPage: lastLoadedPageArg,
    onSuccess,
    search: searchArg,
    sort,
    value: valueArg
  }) => {
    if (!permissions) {
      return;
    }
    queueTask(async () => {
      const lastFullyLoadedRelationToUse = typeof lastFullyLoadedRelationArg !== 'undefined' ? lastFullyLoadedRelationArg : -1;
      const relations = Array.isArray(relationTo) ? relationTo : [relationTo];
      const relationsToFetch = lastFullyLoadedRelationToUse === -1 ? relations : relations.slice(lastFullyLoadedRelationToUse + 1);
      let resultsFetched = 0;
      const relationMap = createRelationMap(hasManyArg === true ? {
        hasMany: true,
        relationTo,
        value: valueArg
      } : {
        hasMany: false,
        relationTo,
        value: valueArg
      });
      if (!errorLoading) {
        await relationsToFetch.reduce(async (priorRelation, relation_0) => {
          const relationFilterOption = filterOptions_0?.[relation_0];
          let lastLoadedPageToUse;
          if (search !== searchArg) {
            lastLoadedPageToUse = 1;
          } else {
            lastLoadedPageToUse = (lastLoadedPageArg[relation_0] || 0) + 1;
          }
          await priorRelation;
          if (relationFilterOption === false) {
            setLastFullyLoadedRelation(relations.indexOf(relation_0));
            return Promise.resolve();
          }
          if (resultsFetched < 10) {
            const collection = getEntityConfig({
              collectionSlug: relation_0
            });
            const fieldToSearch = collection?.admin?.useAsTitle || 'id';
            let fieldToSort = collection?.defaultSort || 'id';
            if (typeof sortOptions === 'string') {
              fieldToSort = sortOptions;
            } else if (sortOptions?.[relation_0]) {
              fieldToSort = sortOptions[relation_0];
            }
            const query = {
              depth: 0,
              draft: true,
              limit: maxResultsPerRequest,
              locale,
              page: lastLoadedPageToUse,
              select: {
                [fieldToSearch]: true
              },
              sort: fieldToSort,
              where: {
                and: [{
                  id: {
                    not_in: relationMap[relation_0]
                  }
                }]
              }
            };
            if (searchArg) {
              query.where.and.push({
                [fieldToSearch]: {
                  like: searchArg
                }
              });
            }
            if (relationFilterOption && typeof relationFilterOption !== 'boolean') {
              query.where.and.push(relationFilterOption);
            }
            sanitizeFilterOptionsQuery(query.where);
            const response = await fetch(formatAdminURL({
              apiRoute: api,
              path: `/${relation_0}`
            }), {
              body: qs.stringify(query),
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Payload-HTTP-Method-Override': 'GET'
              },
              method: 'POST'
            });
            if (response.ok) {
              const data = await response.json();
              setLastLoadedPage(prevState => {
                return {
                  ...prevState,
                  [relation_0]: lastLoadedPageToUse
                };
              });
              if (!data.nextPage) {
                setLastFullyLoadedRelation(relations.indexOf(relation_0));
              }
              if (data.docs.length > 0) {
                resultsFetched += data.docs.length;
                dispatchOptions({
                  type: 'ADD',
                  collection,
                  config,
                  docs: data.docs,
                  i18n,
                  sort
                });
              }
            } else if (response.status === 403) {
              setLastFullyLoadedRelation(relations.indexOf(relation_0));
              dispatchOptions({
                type: 'ADD',
                collection,
                config,
                docs: [],
                i18n,
                ids: relationMap[relation_0],
                sort
              });
            } else {
              setErrorLoading(t('error:unspecific'));
            }
          }
        }, Promise.resolve());
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      }
    });
  }, [permissions, queueTask, relationTo, errorLoading, search, getEntityConfig, sortOptions, maxResultsPerRequest, locale, api, i18n, config, t]);
  const updateSearch = useDebouncedCallback(({
    hasMany: hasManyArg_0,
    search: searchArg_0,
    value: value_0
  }) => {
    updateResultsEffectEvent({
      filterOptions,
      lastLoadedPage: {},
      onSuccess: () => {
        setIsLoading(false);
      },
      search: searchArg_0,
      sort: true,
      ...(hasManyArg_0 === true ? {
        hasMany: hasManyArg_0,
        value: value_0
      } : {
        hasMany: hasManyArg_0,
        value: value_0
      })
    });
    setSearch(searchArg_0);
  }, 300);
  const handleInputChange = useCallback(options_0 => {
    if (search !== options_0.search) {
      setIsLoading(true);
      setLastLoadedPage({});
      updateSearch(options_0);
    }
  }, [search, updateSearch]);
  const handleValueChange = useEffectEvent(({
    hasMany: hasManyArg_1,
    value: value_1
  }) => {
    const relationMap_0 = createRelationMap(hasManyArg_1 === true ? {
      hasMany: hasManyArg_1,
      relationTo,
      value: value_1
    } : {
      hasMany: hasManyArg_1,
      relationTo,
      value: value_1
    });
    void Object.entries(relationMap_0).reduce(async (priorRelation_0, [relation_1, ids]) => {
      await priorRelation_0;
      const idsToLoad = ids.filter(id => {
        return !options.find(optionGroup => optionGroup?.options?.find(option => option.value === id && option.relationTo === relation_1));
      });
      if (idsToLoad.length > 0) {
        const collection_0 = getEntityConfig({
          collectionSlug: relation_1
        });
        const fieldToSelect = collection_0?.admin?.useAsTitle || 'id';
        const query_0 = {
          depth: 0,
          draft: true,
          limit: idsToLoad.length,
          locale,
          select: {
            [fieldToSelect]: true
          },
          where: {
            id: {
              in: idsToLoad
            }
          }
        };
        if (!errorLoading) {
          const response_0 = await fetch(formatAdminURL({
            apiRoute: api,
            path: `/${relation_1}`
          }), {
            body: qs.stringify(query_0),
            credentials: 'include',
            headers: {
              'Accept-Language': i18n.language,
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Payload-HTTP-Method-Override': 'GET'
            },
            method: 'POST'
          });
          let docs = [];
          if (response_0.ok) {
            const data_0 = await response_0.json();
            docs = data_0.docs;
          }
          dispatchOptions({
            type: 'ADD',
            collection: collection_0,
            config,
            docs,
            i18n,
            ids: idsToLoad,
            sort: true
          });
        }
      }
    }, Promise.resolve());
  });
  const {
    mostRecentUpdate
  } = useDocumentEvents();
  const handleDocumentUpdateEvent = useEffectEvent(mostRecentUpdate_0 => {
    if (!value) {
      return false;
    }
    const docID = mostRecentUpdate_0.doc.id;
    let isMatchingUpdate = false;
    if (mostRecentUpdate_0.operation === 'update') {
      if (hasMany === true) {
        const currentValue = Array.isArray(value) ? value : [value];
        isMatchingUpdate = currentValue.some(option_0 => {
          return option_0.value === docID && option_0.relationTo === mostRecentUpdate_0.entitySlug;
        });
      } else if (hasMany === false) {
        isMatchingUpdate = value?.value === docID && value?.relationTo === mostRecentUpdate_0.entitySlug;
      }
    } else if (mostRecentUpdate_0.operation === 'create') {
      // "Create New" drawer operations on the same level as this drawer should
      // set the value to the newly created document.
      // See test "should create document within document drawer > has one"
      isMatchingUpdate = mostRecentUpdate_0.drawerSlug === drawerSlug;
    }
    if (!isMatchingUpdate) {
      return;
    }
    const collectionConfig = getEntityConfig({
      collectionSlug: mostRecentUpdate_0.entitySlug
    });
    dispatchOptions({
      type: 'UPDATE',
      collection: collectionConfig,
      config,
      doc: mostRecentUpdate_0.doc,
      i18n
    });
    if (hasMany) {
      const currentValue_0 = value ? Array.isArray(value) ? value : [value] : [];
      const valuesToSet = currentValue_0.map(option_1 => {
        return {
          relationTo: option_1.value === docID ? mostRecentUpdate_0.entitySlug : option_1.relationTo,
          value: option_1.value
        };
      });
      onChange(valuesToSet);
    } else if (hasMany === false) {
      onChange({
        relationTo: mostRecentUpdate_0.entitySlug,
        value: docID
      });
    }
  });
  /**
  * Listen to document update events. If you edit a related document from a drawer and save it, this event
  * will be triggered. We then need up update the label of this relationship input, as the useAsLabel field could have changed.
  *
  * We listen to this event instead of using the onSave callback on the document drawer, as the onSave callback is not triggered
  * when you save a document from a drawer opened by a *different* relationship (or any other) field.
  */
  useEffect(() => {
    if (mostRecentUpdate) {
      handleDocumentUpdateEvent(mostRecentUpdate);
    }
  }, [mostRecentUpdate]);
  const onDuplicate = useCallback(args => {
    dispatchOptions({
      type: 'ADD',
      collection: args.collectionConfig,
      config,
      docs: [args.doc],
      i18n,
      sort: true
    });
    if (hasMany) {
      onChange(value ? value.concat({
        relationTo: args.collectionConfig.slug,
        value: args.doc.id
      }) : null);
    } else if (hasMany === false) {
      onChange({
        relationTo: args.collectionConfig.slug,
        value: args.doc.id
      });
    }
  }, [i18n, config, hasMany, onChange, value]);
  const onDelete = useCallback(args_0 => {
    dispatchOptions({
      id: args_0.id,
      type: 'REMOVE',
      collection: args_0.collectionConfig,
      config,
      i18n
    });
    if (hasMany) {
      onChange(value ? value.filter(option_2 => {
        return option_2.value !== args_0.id;
      }) : null);
    } else {
      onChange(null);
    }
    return;
  }, [i18n, config, hasMany, onChange, value]);
  const filterOption = useCallback((item, searchFilter) => {
    if (!searchFilter) {
      return true;
    }
    const r = wordBoundariesRegex(searchFilter || '');
    // breaking the labels to search into smaller parts increases performance
    const breakApartThreshold = 250;
    let labelString = String(item.label);
    // strings less than breakApartThreshold length won't be chunked
    while (labelString.length > breakApartThreshold) {
      // slicing by the next space after the length of the search input prevents slicing the string up by partial words
      const indexOfSpace = labelString.indexOf(' ', searchFilter.length);
      if (r.test(labelString.slice(0, indexOfSpace === -1 ? searchFilter.length : indexOfSpace + 1))) {
        return true;
      }
      labelString = labelString.slice(indexOfSpace === -1 ? searchFilter.length : indexOfSpace + 1);
    }
    return r.test(labelString.slice(-breakApartThreshold));
  }, []);
  const onDocumentOpen = useCallback(({
    id: id_0,
    collectionSlug: collectionSlug_0,
    hasReadPermission,
    openInNewTab
  }) => {
    if (openInNewTab) {
      if (hasReadPermission && id_0 && collectionSlug_0) {
        const docUrl = formatAdminURL({
          adminRoute: config.routes.admin,
          path: `/collections/${collectionSlug_0}/${id_0}`,
          serverURL
        });
        window.open(docUrl, '_blank');
      }
    } else {
      openDrawerWhenRelationChanges.current = true;
      setCurrentlyOpenRelationship({
        id: id_0,
        collectionSlug: collectionSlug_0,
        hasReadPermission
      });
    }
  }, [config.routes.admin, serverURL]);
  const updateResultsEffectEvent = useEffectEvent(args_1 => {
    return updateResults(args_1);
  });
  // When (`relationTo` || `filterOptions` || `locale`) changes, reset component
  // Note - effect should not run on first run
  useEffect(() => {
    // If the menu is open while filterOptions changes
    // due to latency of form state and fast clicking into this field,
    // re-fetch options
    if (hasLoadedFirstPageRef.current && menuIsOpen) {
      setIsLoading(true);
      void updateResultsEffectEvent({
        filterOptions,
        lastLoadedPage: {},
        onSuccess: () => {
          hasLoadedFirstPageRef.current = true;
          setIsLoading(false);
        },
        ...(hasMany === true ? {
          hasMany,
          value: valueRef.current
        } : {
          hasMany,
          value: valueRef.current
        })
      });
    }
    // If the menu is not open, still reset the field state
    // because we need to get new options next time the menu opens
    dispatchOptions({
      type: 'CLEAR',
      exemptValues: valueRef.current
    });
    setLastFullyLoadedRelation(-1);
    setLastLoadedPage({});
  }, [relationTo, filterOptions, locale, path, menuIsOpen, hasMany]);
  const prevValue = useRef(value);
  const isFirstRenderRef = useRef(true);
  // ///////////////////////////////////
  // Ensure we have an option for each value
  // ///////////////////////////////////
  useEffect(() => {
    if (isFirstRenderRef.current || !dequal(value, prevValue.current)) {
      handleValueChange(hasMany === true ? {
        hasMany,
        value
      } : {
        hasMany,
        value
      });
    }
    isFirstRenderRef.current = false;
    prevValue.current = value;
  }, [value, hasMany]);
  // Determine if we should switch to word boundary search
  useEffect(() => {
    const relations_0 = Array.isArray(relationTo) ? relationTo : [relationTo];
    const isIdOnly = relations_0.reduce((idOnly, relation_2) => {
      const collection_1 = getEntityConfig({
        collectionSlug: relation_2
      });
      const fieldToSearch_0 = collection_1?.admin?.useAsTitle || 'id';
      return fieldToSearch_0 === 'id' && idOnly;
    }, true);
    setEnableWordBoundarySearch(!isIdOnly);
  }, [relationTo, getEntityConfig]);
  useEffect(() => {
    if (openDrawerWhenRelationChanges.current) {
      openDrawer();
      openDrawerWhenRelationChanges.current = false;
    }
  }, [openDrawer, currentlyOpenRelationship]);
  useEffect(() => {
    // needed to sync the ref value when other fields influence the value
    // i.e. when a drawer is opened and the value is set
    valueRef.current = value;
  }, [value]);
  const valueToRender = findOptionsByValue({
    allowEdit,
    options,
    value
  });
  if (!Array.isArray(valueToRender) && valueToRender?.value === 'null') {
    valueToRender.value = null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: [fieldBaseClass, baseClass, className, showError && 'error', errorLoading && 'error-loading', readOnly && `${baseClass}--read-only`, !readOnly && allowCreate && `${baseClass}--allow-create`].filter(Boolean).join(' '),
    id: `field-${path.replace(/\./g, '__')}`,
    style: style,
    children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
      CustomComponent: Label,
      Fallback: /*#__PURE__*/_jsx(FieldLabel, {
        label: label,
        localized: localized,
        path: path,
        required: required
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: `${fieldBaseClass}__wrap`,
      children: [/*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Error,
        Fallback: /*#__PURE__*/_jsx(FieldError, {
          path: path,
          showError: showError
        })
      }), BeforeInput, errorLoading ? /*#__PURE__*/_jsx("div", {
        className: `${baseClass}__error-loading`,
        children: errorLoading
      }) : /*#__PURE__*/_jsxs("div", {
        className: `${baseClass}__wrap`,
        children: [/*#__PURE__*/_jsx(ReactSelect, {
          backspaceRemovesValue: !(isDrawerOpen || isListDrawerOpen),
          components: {
            MultiValueLabel,
            SingleValue,
            ...(appearance !== 'select' && {
              DropdownIndicator: null
            })
          },
          customProps: {
            disableKeyDown: isDrawerOpen || isListDrawerOpen,
            disableMouseDown: isDrawerOpen || isListDrawerOpen,
            onDocumentOpen
          },
          disabled: readOnly || isDrawerOpen || isListDrawerOpen,
          filterOption: enableWordBoundarySearch ? filterOption : undefined,
          getOptionValue: option_3 => {
            if (!option_3) {
              return undefined;
            }
            return hasMany && Array.isArray(relationTo) ? `${option_3.relationTo}_${option_3.value}` : option_3.value;
          },
          isLoading: appearance === 'select' && isLoading,
          isMulti: hasMany,
          isSearchable: appearance === 'select',
          isSortable: isSortable,
          menuIsOpen: appearance === 'select' ? menuIsOpen : false,
          onChange: !readOnly ? selected => {
            if (hasMany) {
              if (selected === null) {
                valueRef.current = [];
                onChange([]);
              } else {
                valueRef.current = selected;
                onChange(selected);
              }
            } else if (hasMany === false) {
              if (selected === null) {
                valueRef.current = null;
                onChange(null);
              } else {
                valueRef.current = selected;
                onChange(selected);
              }
            }
          } : undefined,
          onInputChange: newSearch => handleInputChange({
            search: newSearch,
            ...(hasMany === true ? {
              hasMany,
              value
            } : {
              hasMany,
              value
            })
          }),
          onMenuClose: () => {
            setMenuIsOpen(false);
          },
          onMenuOpen: () => {
            if (appearance === 'drawer') {
              openListDrawer();
            } else if (appearance === 'select') {
              setMenuIsOpen(true);
              if (!hasLoadedFirstPageRef.current) {
                setIsLoading(true);
                updateResultsEffectEvent({
                  filterOptions,
                  lastLoadedPage: {},
                  onSuccess: () => {
                    hasLoadedFirstPageRef.current = true;
                    setIsLoading(false);
                  },
                  ...(hasMany === true ? {
                    hasMany,
                    value
                  } : {
                    hasMany,
                    value
                  })
                });
              }
            }
          },
          onMenuScrollToBottom: () => {
            setIsLoading(true);
            updateResultsEffectEvent({
              filterOptions,
              lastFullyLoadedRelation,
              lastLoadedPage,
              onSuccess: () => {
                setIsLoading(false);
              },
              search,
              sort: false,
              ...(hasMany === true ? {
                hasMany,
                value: initialValue
              } : {
                hasMany,
                value: initialValue
              })
            });
          },
          options: typeof formatDisplayedOptions === 'function' ? formatDisplayedOptions(options) : options,
          placeholder: placeholder,
          showError: showError,
          value: valueToRender ?? null
        }), !readOnly && allowCreate && /*#__PURE__*/_jsx(AddNewRelation, {
          path: path,
          relationTo: relationTo,
          ...(hasMany === true ? {
            hasMany,
            onChange,
            value
          } : {
            hasMany,
            onChange,
            value
          })
        })]
      }), AfterInput, /*#__PURE__*/_jsx(RenderCustomComponent, {
        CustomComponent: Description,
        Fallback: /*#__PURE__*/_jsx(FieldDescription, {
          description: description,
          path: path
        })
      })]
    }), currentlyOpenRelationship.collectionSlug && currentlyOpenRelationship.hasReadPermission && /*#__PURE__*/_jsx(DocumentDrawer, {
      onDelete: onDelete,
      onDuplicate: onDuplicate
    }), appearance === 'drawer' && !readOnly && /*#__PURE__*/_jsx(ListDrawer, {
      allowCreate: allowCreate,
      enableRowSelections: false,
      onSelect: onListSelect
    })]
  });
};
//# sourceMappingURL=Input.js.map