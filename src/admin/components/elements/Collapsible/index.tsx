import React, { useState } from 'react';
import AnimateHeight from 'react-animate-height';
import Button from '../Button';
import { Props } from './types';
import { CollapsibleProvider, useCollapsible } from './provider';

import './index.scss';

const baseClass = 'collapsible';

export const Collapsible: React.FC<Props> = ({ children, onToggle, className, header }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isNested = useCollapsible();

  return (
    <div className={[
      baseClass,
      className,
      collapsed && `${baseClass}--collapsed`,
      isNested && `${baseClass}--nested`,
    ].filter(Boolean).join(' ')}
    >
      <CollapsibleProvider withinCollapsible>
        <header>
          {header && (
            <div className={`${baseClass}__header-wrap`}>
              {header}
            </div>
          )}
          <Button
            icon="chevron"
            onClick={() => {
              if (typeof onToggle === 'function') onToggle(!collapsed);
              setCollapsed(!collapsed);
            }}
            buttonStyle="icon-label"
            className={`${baseClass}__toggle ${baseClass}__toggle--${collapsed ? 'collapsed' : 'open'}`}
            round
          />
        </header>
        <AnimateHeight
          height={collapsed ? 0 : 'auto'}
          duration={200}
        >
          <div className={`${baseClass}__content`}>
            {children}
          </div>
        </AnimateHeight>
      </CollapsibleProvider>
    </div>
  );
};
