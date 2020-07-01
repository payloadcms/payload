import useFormFields from '../components/forms/Form/useFormFields';

const useTitle = (useAsTitle) => {
  const { getField } = useFormFields();
  const titleField = getField(useAsTitle);
  return titleField?.value;
};

export default useTitle;
