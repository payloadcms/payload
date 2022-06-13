import { Option, Action } from './types';

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

const optionsReducer = (state: Option[], action: Action): Option[] => {
  switch (action.type) {
    case 'CLEAR': {
      return action.required ? [] : [{ value: 'null', label: 'None' }];
    }

    case 'ADD': {
      const { hasMultipleRelations, collection, relation, data, sort, ids = [] } = action;

      const labelKey = collection.admin.useAsTitle || 'id';

      const loadedIDs = reduceToIDs(state);

      if (!hasMultipleRelations) {
        const options = [
          ...state,
          ...data.docs.reduce((docs, doc) => {
            if (loadedIDs.indexOf(doc.id) === -1) {
              loadedIDs.push(doc.id);
              return [
                ...docs,
                {
                  label: doc[labelKey] || `Untitled - ID: ${doc.id}`,
                  value: doc.id,
                },
              ];
            }
            return docs;
          },
          [
            ...ids.map((id) => ({
              label: labelKey === 'id' ? id : `Untitled - ID: ${id}`,
              value: id,
            })),
          ]),
        ];

        return sort ? sortOptions(options) : options;
      }

      const newOptions = [...state];
      const optionsToAddTo = newOptions.find((optionGroup) => optionGroup.label === collection.labels.plural);

      const newSubOptions = data.docs.reduce((docs, doc) => {
        if (loadedIDs.indexOf(doc.id) === -1) {
          loadedIDs.push(doc.id);

          return [
            ...docs,
            {
              label: doc[labelKey] || `Untitled - ID: ${doc.id}`,
              relationTo: relation,
              value: doc.id,
            },
          ];
        }

        return docs;
      },
      [
        ...ids.map((id) => ({
          label: labelKey === 'id' ? id : `Untitled - ID: ${id}`,
          value: id,
          relationTo: relation,
        })),
      ]);

      if (optionsToAddTo) {
        const subOptions = [
          ...optionsToAddTo.options,
          ...newSubOptions,
        ];

        optionsToAddTo.options = sort ? sortOptions(subOptions) : subOptions;
      } else {
        newOptions.push({
          label: collection.labels.plural,
          options: sort ? sortOptions(newSubOptions) : newSubOptions,
          value: undefined,
        });
      }

      return newOptions;
    }


    default: {
      return state;
    }
  }
};

export default optionsReducer;
