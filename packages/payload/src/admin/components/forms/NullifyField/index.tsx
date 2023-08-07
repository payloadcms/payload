import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckboxInput } from '../field-types/Checkbox/Input';
import { Banner } from '../../elements/Banner';
import { useLocale } from '../../utilities/Locale';
import { useConfig } from '../../utilities/Config';
import { useForm } from '../Form/context';

type NullifyLocaleFieldProps = {
  localized: boolean
  path: string
  fieldValue?: null | [] | number
}
export const NullifyLocaleField: React.FC<NullifyLocaleFieldProps> = ({ localized, path, fieldValue }) => {
  const { dispatchFields, setModified } = useForm();
  const currentLocale = useLocale();
  const { localization } = useConfig();
  const [checked, setChecked] = React.useState<boolean>(typeof fieldValue !== 'number');
  const defaultLocale = (localization && localization.defaultLocale) ? localization.defaultLocale : 'en';
  const { t } = useTranslation('general');

  const onChange = () => {
    const useFallback = !checked;

    dispatchFields({
      type: 'UPDATE',
      path,
      value: useFallback ? null : (fieldValue || 0),
    });
    setModified(true);
    setChecked(useFallback);
  };

  if (!localized || currentLocale === defaultLocale || (localization && !localization.fallback)) {
    // hide when field is not localized or editing default locale or when fallback is disabled
    return null;
  }

  if (fieldValue) {
    let hideCheckbox = false;
    if (typeof fieldValue === 'number' && fieldValue > 0) hideCheckbox = true;
    if (Array.isArray(fieldValue) && fieldValue.length > 0) hideCheckbox = true;

    if (hideCheckbox) {
      if (checked) setChecked(false); // uncheck when field has value
      return null;
    }
  }

  return (
    <Banner>
      <CheckboxInput
        id={`field-${path.replace(/\./gi, '__')}`}
        onToggle={onChange}
        label={t('fallbackToDefaultLocale')}
        checked={checked}
      />
    </Banner>
  );
};
