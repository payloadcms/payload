import React from 'react';

import classes from './index.module.scss';

export const TextArea: React.FC<{
  disabled?: boolean
  icon?: React.ReactNode
  value?: string
}> = ({ disabled, icon, value }) => {
  return (
    <div className={classes.wrap}>
      <textarea
        className={classes.input}
        disabled={disabled}
        value={value || ''}
      />
      {icon && (
        <div className={classes.iconWrapper}>
          {icon && <div className={classes.icon}>{icon}</div>}
        </div>
      )}
    </div>
  )
}
