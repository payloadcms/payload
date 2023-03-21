import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { SanitizedConfig } from '../../config/types';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { useFormFields } from '../components/forms/Form/context';
import { Field } from '../components/forms/Form/types';
import { useConfig } from '../components/utilities/Config';
import { formatDate } from '../utilities/formatDate';
import { getObjectDotNotation } from '../../utilities/getObjectDotNotation';

// either send a `field` or an entire `doc`
export const formatUseAsTitle = (args: {
  field?: Field
  doc?: Record<string, any>
  collection: SanitizedCollectionConfig
  i18n: typeof i18next
  config: SanitizedConfig
}): string => {
  const {
    field: fieldFromProps,
    doc,
    collection,
    collection: {
      admin: { useAsTitle },
    },
    i18n,
    config: {
      admin: {
        dateFormat: dateFormatFromConfig,
      },
    },
  } = args;

  if (!fieldFromProps && !doc) {
    return '';
  }

  const field = fieldFromProps || getObjectDotNotation<Field>(doc, collection.admin.useAsTitle);

  let title = typeof field === 'string' ? field : field?.value as string;

  const fieldConfig = collection?.fields?.find((f) => 'name' in f && f?.name === useAsTitle);
  const isDate = fieldConfig?.type === 'date';

  if (title && isDate) {
    const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig;
    title = formatDate(title, dateFormat, i18n?.language);
  }

  return title;
};

const useTitle = (collection: SanitizedCollectionConfig): string => {
  const { i18n } = useTranslation();
  const field = useFormFields(([formFields]) => formFields[collection?.admin?.useAsTitle]);
  const config = useConfig();

  return formatUseAsTitle({ field, collection, i18n, config });
};

export default useTitle;
