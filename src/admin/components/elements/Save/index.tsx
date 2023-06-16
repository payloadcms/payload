import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FormSubmit from '../../forms/Submit';
import useHotkey from '../../../hooks/useHotkey';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';
import { useEditDepth } from '../../utilities/EditDepth';

export type CustomSaveButtonProps = React.ComponentType<DefaultSaveButtonProps & {
  DefaultButton: React.ComponentType<DefaultSaveButtonProps>;
}>
type DefaultSaveButtonProps = {
  label: string;
};
const DefaultSaveButton: React.FC<DefaultSaveButtonProps> = ({ label }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const editDepth = useEditDepth();

  useHotkey({ keyCodes: ['s'], cmdCtrlKey: true, editDepth }, (e, deps) => {
    e.preventDefault();
    e.stopPropagation();
    const [enableClick] = deps as [boolean];
    if (enableClick && ref.current) {
      ref.current.click();
    }
  }, [true]);

  return (
    <FormSubmit
      buttonId="action-save"
      ref={ref}
    >
      {label}
    </FormSubmit>
  );
};

type Props = {
  CustomComponent?: CustomSaveButtonProps;
}
export const Save: React.FC<Props> = ({ CustomComponent }) => {
  const { t } = useTranslation('general');

  return (
    <RenderCustomComponent
      CustomComponent={CustomComponent}
      DefaultComponent={DefaultSaveButton}
      componentProps={{
        label: t('save'),
        DefaultButton: DefaultSaveButton,
      }}
    />
  );
};
