import React from 'react';
import PropTypes from 'prop-types';
import { useFormFields } from '../FormProvider/context';
import HiddenInput from '../field-types/HiddenInput';
import { useLocale } from '../../utilities/Locale';

import './index.scss';

const baseClass = 'form';

const Form = (props) => {
  const {
    children,
    className,
  } = props;

  const locale = useLocale();
  const { submit } = useFormFields();

  const classes = [
    className,
    baseClass,
  ].filter(Boolean).join(' ');

  return (
    <form
      noValidate
      onSubmit={submit}
      className={classes}
    >
      <HiddenInput
        path="locale"
        defaultValue={locale}
      />
      {children}
    </form>
  );
};

Form.defaultProps = {
  className: '',
};

Form.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
  className: PropTypes.string,
};

export default Form;
