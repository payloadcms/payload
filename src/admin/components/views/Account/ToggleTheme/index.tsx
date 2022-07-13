import React, { useCallback } from 'react';
import RadioGroupInput from '../../../forms/field-types/RadioGroup/Input';
import { OnChange } from '../../../forms/field-types/RadioGroup/types';
import { Theme, useTheme } from '../../../utilities/Theme';

export const ToggleTheme: React.FC = () => {
  const { theme, setTheme, autoMode } = useTheme();

  const onChange = useCallback<OnChange<Theme>>((newTheme) => {
    setTheme(newTheme);
  }, [setTheme]);

  return (
    <RadioGroupInput
      name="theme"
      label="Admin Theme"
      value={autoMode ? 'auto' : theme}
      onChange={onChange}
      options={[
        {
          label: 'Automatic',
          value: 'auto',
        },
        {
          label: 'Light',
          value: 'light',
        },
        {
          label: 'Dark',
          value: 'dark',
        },
      ]}
    />
  );
};
