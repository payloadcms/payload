import { useWatchForm } from '../components/forms/Form/context';

const useTitle = (useAsTitle: string): string => {
  const { getField } = useWatchForm();
  const titleField = getField(useAsTitle);
  return titleField?.value as string;
};

export default useTitle;
