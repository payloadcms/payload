/* eslint-disable no-alert */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/default-props-match-prop-types */
import React from 'react';
import { useSlate } from 'slate-react';
import PropTypes from 'prop-types';
import ElementButton from './ElementButton';
import { withLinks, insertLink } from './linkUtilities';

const elementDefaultProps = {
  attributes: {},
  children: null,
};

const elementPropTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
};

const H1 = ({ attributes, children }) => (
  <h1 {...attributes}>{children}</h1>
);

const UL = ({ attributes, children }) => (
  <ul {...attributes}>{children}</ul>
);

const OL = ({ attributes, children }) => (
  <ol {...attributes}>{children}</ol>
);

const LI = ({ attributes, children }) => (
  <li {...attributes}>{children}</li>
);

const Link = ({ attributes, children, element }) => (
  <a
    {...attributes}
    href={element.url}
  >
    {children}
  </a>
);

H1.defaultProps = elementDefaultProps;
H1.propTypes = elementPropTypes;

UL.defaultProps = elementDefaultProps;
UL.propTypes = elementPropTypes;

OL.defaultProps = elementDefaultProps;
OL.propTypes = elementPropTypes;

LI.defaultProps = elementDefaultProps;
LI.propTypes = elementPropTypes;

Link.defaultProps = elementDefaultProps;
Link.propTypes = {
  ...elementPropTypes,
  element: PropTypes.shape({
    url: PropTypes.string,
  }).isRequired,
};

const elementTypes = {
  h1: {
    button: () => (
      <ElementButton
        format="h1"
        icon="h1"
      />
    ),
    element: H1,
  },
  ul: {
    button: () => (
      <ElementButton
        format="ul"
        icon="ul"
      />
    ),
    element: UL,
  },
  ol: {
    button: () => (
      <ElementButton
        format="ol"
        icon="ol"
      />
    ),
    element: OL,
  },
  li: {
    element: LI,
  },
  link: {
    button: () => {
      const editor = useSlate();
      return (
        <ElementButton
          onClick={(event) => {
            event.preventDefault();
            const url = window.prompt('Enter the URL of the link:');
            if (!url) return;
            insertLink(editor, url);
          }}
          format="link"
          icon="link"
        />
      );
    },
    element: Link,
    plugin: withLinks,
  },
};

export default elementTypes;
