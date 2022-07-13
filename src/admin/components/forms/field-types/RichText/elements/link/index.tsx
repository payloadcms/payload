import React, { Fragment, useCallback, useState } from 'react';
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
import { useTheme } from '../../../../../utilities/Theme';

const baseClass = 'rich-text-link';

const Link = ({ attributes, children, element, editorRef }) => {
  const editor = useSlate();
  const { theme } = useTheme();
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(element.url === undefined);

  const handleToggleOpen = useCallback((newOpen) => {
    setOpen(newOpen);

    if (element.url === undefined && !newOpen) {
      const path = ReactEditor.findPath(editor, element);

      Transforms.setNodes(
        editor,
        { url: '' },
        { at: path },
      );
    }
  }, [editor, element]);

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
          initActive={element.url === undefined}
          buttonType="none"
          size="small"
          color={theme === 'dark' ? 'light' : 'dark'}
          horizontalAlign="center"
          forceOpen={open}
          onToggleOpen={handleToggleOpen}
          boundingRef={editorRef}
          render={({ close }) => (
            <Fragment>
              <div className={`${baseClass}__url-wrap`}>
                <input
                  value={element.url || ''}
                  className={`${baseClass}__url`}
                  placeholder="Enter a URL"
                  onChange={(e) => {
                    const { value } = e.target;

                    if (value && error) {
                      setError(false);
                    }

                    const path = ReactEditor.findPath(editor, element);

                    Transforms.setNodes(
                      editor,
                      { url: value },
                      { at: path },
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
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

                    if (element.url) {
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
                className={[`${baseClass}__new-tab`, element.newTab && `${baseClass}__new-tab--checked`].filter(Boolean).join(' ')}
                buttonStyle="none"
                onClick={() => {
                  const path = ReactEditor.findPath(editor, element);

                  Transforms.setNodes(
                    editor,
                    { newTab: !element.newTab },
                    { at: path },
                  );
                }}
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
