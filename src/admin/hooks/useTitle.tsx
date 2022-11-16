import { useFormFields } from '../components/forms/Form/context';

const useTitle = (useAsTitle: string): string => {
  const titleField = useFormFields(([fields]) => fields[useAsTitle]);
  return titleField?.value as string;
};

export default useTitle;
