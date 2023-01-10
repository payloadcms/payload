import { format } from 'date-fns';
import { useRelatedCollections } from '../components/forms/field-types/Relationship/AddNew/useRelatedCollections';
import { useFormFields } from '../components/forms/Form/context';
import { useConfig } from '../components/utilities/Config';

const useTitle = (useAsTitle: string, collection: string): string => {
  const titleField = useFormFields(([fields]) => fields[useAsTitle]);
  const value: string = titleField?.value as string || '';

  const { admin: { dateFormat: dateFormatFromConfig } } = useConfig();
  const collectionConfig = useRelatedCollections(collection)?.[0];
  const fieldConfig = collectionConfig?.fields?.find((field) => 'name' in field && field?.name === useAsTitle);

  const isDate = fieldConfig?.type === 'date';

  let title = value;

  if (isDate && value) {
    const dateFormat = fieldConfig?.admin?.date?.displayFormat || dateFormatFromConfig;
    title = format(new Date(value), dateFormat);
  }

  return title;
};

export default useTitle;
