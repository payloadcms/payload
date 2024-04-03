import * as React from 'react'

import type { CustomPublishButtonType } from '../../../../packages/payload/src/admin/components/elements/types'

// In your projects, you can import as follows:
// import { CustomPublishButtonType } from 'payload/types';

import classes from './index.module.scss'

export const CustomPublishButton: CustomPublishButtonType = ({ DefaultButton, ...rest }) => {
  return (
    <div className={classes.customButton}>
      <DefaultButton {...rest} />
    </div>
  )
}
