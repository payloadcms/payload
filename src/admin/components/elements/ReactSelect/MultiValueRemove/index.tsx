import React from 'react';
import { useTranslation } from 'react-i18next';
import { MultiValueRemoveProps } from 'react-select';
import X from '../../../icons/X';
import Tooltip from '../../Tooltip';
import { Option as OptionType } from '../types';
import './index.scss';

const baseClass = 'multi-value-remove';

export const MultiValueRemove: React.FC<MultiValueRemoveProps<OptionType> & {
  innerProps: JSX.IntrinsicElements['button']
}> = (props) => {
  const {
    innerProps: {
      className,
      onClick,
      onTouchEnd,
    },
  } = props;

  const [showTooltip, setShowTooltip] = React.useState(false);
  const { t } = useTranslation('general');

  return (
    <button
      type="button"
      className={[
        baseClass,
        className,
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchEnd={onTouchEnd}
      onClick={(e) => {
        setShowTooltip(false);
        onClick(e);
      }}
      aria-label={t('remove')}
    >
      <Tooltip
        className={`${baseClass}__tooltip`}
        show={showTooltip}
      >
        {t('remove')}
      </Tooltip>
      <X className={`${baseClass}__icon`} />
    </button>
  );
};
