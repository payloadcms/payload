import { optionIsObject, RadioField, SelectField } from '../../fields/config/types.js';
import formatName from './formatName.js';

const formatOptions = (field: RadioField | SelectField) => {
  return field.options.reduce((values, option) => {
    if (optionIsObject(option)) {
      return {
        ...values,
        [formatName(option.value)]: {
          value: option.value,
        },
      };
    }

    return {
      ...values,
      [formatName(option)]: {
        value: option,
      },
    };
  }, {});
};


export default formatOptions;
