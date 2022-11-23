import { Option, Action, OptionGroup } from './types';
import { getTranslation } from '../../../../../utilities/getTranslation';
import QueryString from 'qs';

const reduceToIDs = (options) => options.reduce((ids, option) => {
  if (option.options) {
    return [
      ...ids,
      ...reduceToIDs(option.options),
    ];
  }

  return [
    ...ids,
    option.value,
  ];
}, []);

const sortOptions = (options: Option[]): Option[] => options.sort((a: Option, b: Option) => {
  if (typeof a?.label?.localeCompare === 'function' && typeof b?.label?.localeCompare === 'function') {
    return a.label.localeCompare(b.label);
  }

  return 0;
});

const getNewOptions = ({
  collection,
  state,
  docs,
  sort,
  ids,
  i18n,
}) => {
  const relation = collection.slug;
  const labelKey = collection.admin.useAsTitle || 'id';
  const loadedIDs = reduceToIDs(state);
  const newOptions = [...state];
  const optionsToAddTo = newOptions.find((optionGroup) => optionGroup.label === collection.labels.plural);

  const newSubOptions = docs.reduce((docSubOptions, doc) => {
    if (loadedIDs.indexOf(doc.id) === -1) {
      loadedIDs.push(doc.id);

      return [
        ...docSubOptions,
        {
          label: doc[labelKey] || `${i18n.t('general:untitled')} - ID: ${doc.id}`,
          relationTo: relation,
          value: doc.id,
        },
      ];
    }

    return docSubOptions;
  }, []);

  ids.forEach((id) => {
    if (!loadedIDs.includes(id)) {
      newSubOptions.push({
        label: labelKey === 'id' ? id : `${i18n.t('general:untitled')} - ID: ${id}`,
        value: id,
      });
    }
  });

  if (optionsToAddTo) {
    const subOptions = [
      ...optionsToAddTo.options,
      ...newSubOptions,
    ];

    optionsToAddTo.options = sort ? sortOptions(subOptions) : subOptions;
  } else {
    newOptions.push({
      label: getTranslation(collection.labels.plural, i18n),
      options: sort ? sortOptions(newSubOptions) : newSubOptions,
    });
  }

  return newOptions;
}

const optionsReducer = (state: OptionGroup[], action: Action): OptionGroup[] => {
  switch (action.type) {
    case 'CLEAR': {
      return [];
    }

    case 'ADD': {
      const { collection, docs, sort, ids = [], i18n } = action;
      return getNewOptions({
        collection,
        state,
        docs,
        sort,
        ids,
        i18n,
      })
    }

    case 'LOAD': {
      const { collection, serverURL, ids = [], i18n, relationTo, api, sort } = action;

      const idsToLoad = ids.filter((id) => {
        return !state.find((optionGroup) => optionGroup?.options?.find((option) => option.value === id && option.relationTo === relationTo));
      });

      const query = {
        where: {
          id: {
            in: idsToLoad,
          },
        },
        depth: 0,
        limit: idsToLoad.length,
      };

      const load = async () => {
        const response = await fetch(`${serverURL}${api}/${relationTo}?${QueryString.stringify(query)}`, {
          credentials: 'include',
          headers: {
            'Accept-Language': i18n.language,
          },
        });

        let docs = [];

        if (response.ok) {
          const data = await response.json();
          docs = data.docs;
        }

        return getNewOptions({
          collection,
          state,
          docs,
          sort,
          ids,
          i18n,
        })
      }

      load();
    }

    default: {
      return state;
    }
  }
};

export default optionsReducer;
