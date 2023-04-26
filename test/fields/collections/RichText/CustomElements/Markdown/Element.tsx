import * as React from 'react';
import { Transforms } from 'slate';
import { ReactEditor, useSlateStatic } from 'slate-react';
import { elementIdentifier } from '.';
import { Field } from '../../../../../../src/fields/config/types';

const valueKey = 'markdownValue';

type ElementProps = {
  attributes: React.HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  element: any
  fieldProps: Field
}
export const Element: React.FC<ElementProps> = (props) => {
  const {
    attributes,
    children,
    element,
  } = props;

  const currentState = element?.[valueKey] || '';
  const editor = useSlateStatic();

  const updateNode = React.useCallback((newValue) => {
    if (currentState !== newValue) {
      const elementPath = ReactEditor.findPath(editor, element);

      Transforms.setNodes(editor,
        {
          type: elementIdentifier,
          [valueKey]: newValue,
          children: [
            { text: ' ' },
          ],
        },
        { at: elementPath });
    }
  }, [editor, element, currentState]);

  const removeNode = React.useCallback(() => {
    const elementPath = ReactEditor.findPath(editor, element);

    Transforms.removeNodes(
      editor,
      { at: elementPath },
    );
  }, [editor, element]);

  return (
    <div
      {...attributes}
      contentEditable={false}
    >
      <div>
        <button
          type="button"
          onClick={removeNode}
        >
          remove
        </button>

        <textarea
          className={classes.textArea}
          onChange={(e) => updateNode(e.target.value)}
          value={currentState}
          style={{
            width: '100%',
            height: '20vh',
            resize: 'vertical',
          }}
        />
      </div>

      {children}
    </div>
  );
};
