import useForm from '../components/forms/Form/useForm';

const useTitle = (useAsTitle) => {
  const { getField } = useForm();
  const titleField = getField(useAsTitle);
  return titleField?.value;
};

export default useTitle;
