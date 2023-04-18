import { LocaleOption } from '../types';
export type Props = {
    onChange: (options: LocaleOption[]) => void;
    value: LocaleOption[];
    options: LocaleOption[];
};
