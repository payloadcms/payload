import { useFormFields } from '../components/forms/Form/context';

const useTitle = (useAsTitle) => {
  const { getField } = useFormFields();
  const titleField = getField(useAsTitle);
  return titleField?.value;
};

export default useTitle;
