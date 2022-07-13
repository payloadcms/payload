import React from 'react';
import { useConfig } from '../../utilities/Config';
import RenderCustomComponent from '../../utilities/RenderCustomComponent';

const css = `
  .graphic-icon path {
    fill: var(--theme-elevation-1000);
  }
`;

const PayloadIcon: React.FC = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 25 25"
    xmlns="http://www.w3.org/2000/svg"
    className="graphic-icon"
  >
    <style>
      {css}
    </style>
    <path
      d="M11.5293 0L23 6.90096V19.9978L14.3608 25V11.9032L2.88452 5.00777L11.5293 0Z"
    />
    <path
      d="M10.6559 24.2727V14.0518L2 19.0651L10.6559 24.2727Z"
    />
  </svg>
);

const Icon: React.FC = () => {
  const {
    admin: {
      components: {
        graphics: {
          Icon: CustomIcon,
        } = {
          Icon: undefined,
        },
      } = {},
    } = {},
  } = useConfig();

  return (
    <RenderCustomComponent
      CustomComponent={CustomIcon}
      DefaultComponent={PayloadIcon}
    />
  );
};

export default Icon;
