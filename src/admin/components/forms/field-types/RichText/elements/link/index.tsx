import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { ReactEditor, useSlate } from 'slate-react';
import { Transforms } from 'slate';
import ElementButton from '../Button';
import { withLinks, wrapLink } from './utilities';
import LinkIcon from '../../../../../icons/Link';
import Popup from '../../../../../elements/Popup';
import Button from '../../../../../elements/Button';
import Check from '../../../../../icons/Check';
import Error from '../../../../Error';

import './index.scss';

const baseClass = 'rich-text-link';

const Link = ({ attributes, children, element }) => {
  const editor = useSlate();
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(!element.url);
  const [url, setURL] = useState(element.url);
  const [newTab, setNewTab] = useState(Boolean(element.newTab));

  useEffect(() => {
    const path = ReactEditor.findPath(editor, element);

    Transforms.setNodes(
      editor,
      { url, newTab },
      { at: path },
    );
  }, [url, newTab, editor, element]);

  const handleToggleOpen = useCallback((toggleResult) => {
    setOpen(toggleResult);
  }, []);

  return (
    <span
      className={baseClass}
      {...attributes}
    >
      <span
        style={{ userSelect: 'none' }}
        contentEditable={false}
      >
        <Popup
          initActive={url === undefined}
          buttonType="none"
          size="small"
          color="dark"
          horizontalAlign="center"
          forceOpen={open}
          onToggleOpen={handleToggleOpen}
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
      </span>
      <button
        className={[
          `${baseClass}__button`,
          open && `${baseClass}__button--open`,
        ].filter(Boolean).join(' ')}
        type="button"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
    </span>
  );
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
  Button: LinkButton,
  Element: Link,
  plugins: [
    withLinks,
  ],
};

export default link;
