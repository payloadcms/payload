import * as React from 'react';
import styled from 'styled-components';

const HighlightText = styled.mark`
  background-color: ${props => props.bg};
`;

export const renderLeafTextBackground = ({ typeBackground = 'text-background', bg = 'red' } = {}) => ({ children, leaf }) => {
  if (leaf[typeBackground]) {
    return (
      <HighlightText
        data-slate-type={typeBackground}
        bg={bg}
      >
        {children}
      </HighlightText>
    );
  }

  return children;
};
