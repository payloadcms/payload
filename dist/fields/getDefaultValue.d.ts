import { User } from '../auth';
type Args = {
    value?: unknown;
    defaultValue: unknown;
    user: User;
    locale: string | undefined;
};
declare const getValueWithDefault: ({ value, defaultValue, locale, user }: Args) => Promise<unknown>;
export default getValueWithDefault;
