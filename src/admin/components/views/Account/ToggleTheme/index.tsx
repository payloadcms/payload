import React, { useCallback } from 'react';
import RadioGroupInput from '../../../forms/field-types/RadioGroup/Input';
import { OnChange } from '../../../forms/field-types/RadioGroup/types';
import { Theme, useTheme } from '../../../utilities/Theme';

export const ToggleTheme: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const onChange = useCallback<OnChange<Theme>>((newTheme) => {
    setTheme(newTheme);
  }, [setTheme]);

  return (
    <RadioGroupInput
      name="theme"
      label="Dark Mode"
      value={theme}
      onChange={onChange}
      options={[
        {
          label: 'Disable',
          value: 'light',
        },
        {
          label: 'Enable',
          value: 'dark',
        },
      ]}
    />
  );
};
