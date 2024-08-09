import { Modal, useModal } from '@faceless-ui/modal'
import React, { Fragment, useCallback } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, useSlate } from 'slate-react'

import Button from '../../../../../../../packages/payload/src/admin/components/elements/Button'
import Form from '../../../../../../../packages/payload/src/admin/components/forms/Form'
import reduceFieldsToValues from '../../../../../../../packages/payload/src/admin/components/forms/Form/reduceFieldsToValues'
import Submit from '../../../../../../../packages/payload/src/admin/components/forms/Submit'
import Checkbox from '../../../../../../../packages/payload/src/admin/components/forms/field-types/Checkbox'
import ElementButton from '../../../../../../../packages/payload/src/admin/components/forms/field-types/RichText/elements/Button'
import Select from '../../../../../../../packages/payload/src/admin/components/forms/field-types/Select'
import Text from '../../../../../../../packages/payload/src/admin/components/forms/field-types/Text'
import X from '../../../../../../../packages/payload/src/admin/components/icons/X'
import MinimalTemplate from '../../../../../../../packages/payload/src/admin/components/templates/Minimal'
import './index.scss'

const baseClass = 'button-rich-text-button'

const initialFormData = {
  style: 'primary',
}

const insertButton = (editor, { href, label, newTab = false, style }: any) => {
  const text = { text: ' ' }
  const button = {
    children: [text],
    href,
    label,
    newTab,
    style,
    type: 'button',
  }

  const nodes = [button, { children: [{ text: '' }] }]

  if (editor.blurSelection) {
    Transforms.select(editor, editor.blurSelection)
  }

  Transforms.insertNodes(editor, nodes)

  const currentPath = editor.selection.anchor.path[0]
  const newSelection = {
    anchor: { offset: 0, path: [currentPath + 1, 0] },
    focus: { offset: 0, path: [currentPath + 1, 0] },
  }

  Transforms.select(editor, newSelection)
  ReactEditor.focus(editor)
}

const ToolbarButton = ({ path }: { path: string }) => {
  const { closeAll, open } = useModal()
  const editor = useSlate()

  const handleAddButton = useCallback(
    (fields) => {
      const data = reduceFieldsToValues(fields)
      insertButton(editor, data)
      closeAll()
    },
    [editor, closeAll],
  )

  const modalSlug = `${path}-add-button`

  return (
    <Fragment>
      <ElementButton className={baseClass} format="button" onClick={() => open(modalSlug)}>
        Button
      </ElementButton>
      <Modal className={`${baseClass}__modal`} slug={modalSlug}>
        <MinimalTemplate>
          <header className={`${baseClass}__header`}>
            <h3>Add button</h3>
            <Button buttonStyle="none" onClick={closeAll}>
              <X />
            </Button>
          </header>
          <Form initialData={initialFormData} onSubmit={handleAddButton}>
            <Text label="Label" name="label" required />
            <Text label="URL" name="href" required />
            <Select
              label="Style"
              name="style"
              options={[
                {
                  label: 'Primary',
                  value: 'primary',
                },
                {
                  label: 'Secondary',
                  value: 'secondary',
                },
              ]}
            />
            <Checkbox label="Open in new tab" name="newTab" />
            <Submit>Add button</Submit>
          </Form>
        </MinimalTemplate>
      </Modal>
    </Fragment>
  )
}

export default ToolbarButton
