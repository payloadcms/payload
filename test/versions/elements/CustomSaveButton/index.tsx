import * as React from 'react';
import { CustomPublishButtonProps } from '../../../../src/admin/components/elements/Publish';

import classes from './index.module.scss';

export const CustomPublishButton: CustomPublishButtonProps = ({ DefaultButton, ...rest }) => {
  return (
    <div className={classes.customButton}>
      <DefaultButton {...rest} />
    </div>
  );
};
