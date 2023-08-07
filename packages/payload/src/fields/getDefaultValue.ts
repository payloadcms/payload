import { User } from '../auth';

type Args = {
  value?: unknown,
  defaultValue: unknown,
  user: User,
  locale: string | undefined,
};

const getValueWithDefault = async ({ value, defaultValue, locale, user }: Args): Promise<unknown> => {
  if (typeof value !== 'undefined') {
    return value;
  }

  if (defaultValue && typeof defaultValue === 'function') {
    return defaultValue({ locale, user });
  }

  return defaultValue;
};

export default getValueWithDefault;
