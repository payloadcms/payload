import { useTranslation } from 'react-i18next';
import { useRelatedCollections } from '../components/forms/field-types/Relationship/AddNew/useRelatedCollections';
import { useFormFields } from '../components/forms/Form/context';
import { useConfig } from '../components/utilities/Config';
import { formatDate } from '../utilities/formatDate';

const useTitle = (useAsTitle: string, collection: string): string => {
  const titleField = useFormFields(([fields]) => fields[useAsTitle]);
  const value: string = titleField?.value as string || '';

  const { admin: { dateFormat: dateFormatFromConfig } } = useConfig();
  const collectionConfig = useRelatedCollections(collection)?.[0];
  const fieldConfig = collectionConfig?.fields?.find((field) => 'name' in field && field?.name === useAsTitle);

  const { i18n } = useTranslation();

  const isDate = fieldConfig?.type === 'date';

  let title = value;

  if (isDate && value) {
    const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig;
    title = formatDate(value, dateFormat, i18n?.language);
  }

  return title;
};

export default useTitle;
