import React, { Fragment, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms } from 'slate';
import ElementButton from '../Button';
import { withLinks, wrapLink } from './utilities';
import LinkIcon from '../../../../../icons/Link';
import Portal from '../../../../../utilities/Portal';
import Popup from '../../../../../elements/Popup';
import Button from '../../../../../elements/Button';
import Check from '../../../../../icons/Check';
import Error from '../../../../Error';

import './index.scss';

const baseClass = 'rich-text-link';

const Link = ({ attributes, children, element }) => {
  const editor = useSlate();
  const linkRef = useRef();
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [url, setURL] = useState(element.url);
  const [newTab, setNewTab] = useState(Boolean(element.newTab));

  useEffect(() => {
    if (linkRef?.current) {
      const rect = linkRef.current.getBoundingClientRect();
      setTop(rect.top);
      setLeft(rect.left);
      setWidth(rect.width);
      setHeight(rect.height);
    }
  }, [children]);

  useEffect(() => {
    const path = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      { url, newTab },
      { at: path },
    );
  }, [url, newTab, editor, element]);

  return (
    <span
      className={baseClass}
      {...attributes}
    >
      <span ref={linkRef}>
        <Portal>
          <div
            className={`${baseClass}__popup-wrap`}
            style={{
              width,
              height,
              top,
              left,
            }}
          >
            <Popup
              initActive={url === undefined}
              className={`${baseClass}__popup`}
              buttonType="custom"
              button={<span className={`${baseClass}__button`} />}
              size="small"
              color="dark"
              horizontalAlign="center"
              render={({ close }) => (
                <Fragment>
                  <div className={`${baseClass}__url-wrap`}>
                    <input
                      value={url || ''}
                      className={`${baseClass}__url`}
                      placeholder="Enter a URL"
                      onChange={(e) => {
                        const { value } = e.target;

                        if (value && error) {
                          setError(false);
                        }

                        setURL(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          close();
                        }
                      }}
                    />
                    <Button
                      className={`${baseClass}__confirm`}
                      buttonStyle="none"
                      icon="chevron"
                      onClick={(e) => {
                        e.preventDefault();

                        if (url) {
                          close();
                        } else {
                          setError(true);
                        }
                      }}
                    />
                    {error && (
                      <Error
                        showError={error}
                        message="Please enter a valid URL."
                      />
                    )}
                  </div>
                  <Button
                    className={[`${baseClass}__new-tab`, newTab && `${baseClass}__new-tab--checked`].filter(Boolean).join(' ')}
                    buttonStyle="none"
                    onClick={() => setNewTab(!newTab)}
                  >
                    <Check />
                    Open link in new tab
                  </Button>
                </Fragment>
              )}
            />
          </div>
        </Portal>
        {children}
      </span>
    </span>
  );
};

Link.defaultProps = {
  attributes: {},
  children: null,
};

Link.propTypes = {
  attributes: PropTypes.shape({}),
  children: PropTypes.node,
  element: PropTypes.shape({
    url: PropTypes.string,
    newTab: PropTypes.bool,
  }).isRequired,
};

const LinkButton = () => {
  const editor = useSlate();

  return (
    <ElementButton
      format="link"
      onClick={() => wrapLink(editor)}
    >
      <LinkIcon />
    </ElementButton>
  );
};

const link = {
  button: LinkButton,
  element: Link,
  plugins: [
    withLinks,
  ],
};

export default link;
