import { OptionLabel } from '@/collections/Products/ui/Variants/VariantOptions/OptionLabel'
import { OptionsSelector } from '@/collections/Products/ui/Variants/VariantOptions/Options'
import { slugify } from '@/collections/Products/utilities/slugify'
import {
  Button,
  Collapsible,
  DragHandleIcon,
  useForm,
  useFormFields,
  useFormSubmitted,
} from '@payloadcms/ui'
import { Trash2Icon, TrashIcon } from 'lucide-react'
import { ArrayField, ClientField, FormState, Row, SanitizedFieldPermissions } from 'payload'
import { HTMLAttributes, MouseEventHandler, useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  readonly addRow: (rowIndex: number) => Promise<void> | void
  readonly CustomRowLabel?: React.ReactNode
  readonly duplicateRow: (rowIndex: number) => void
  readonly errorCount: number
  readonly fields: ClientField[]
  readonly forceRender?: boolean
  readonly hasMaxRows?: boolean
  readonly isLoading?: boolean
  readonly isSortable?: boolean
  readonly labels: Partial<ArrayField['labels']>
  readonly moveRow: (fromIndex: number, toIndex: number) => void
  readonly parentPath: string
  readonly path: string
  readonly permissions: SanitizedFieldPermissions
  readonly readOnly?: boolean
  readonly removeRow: (rowIndex: number) => void
  readonly row: Row
  readonly rowCount: number
  readonly rowIndex: number
  readonly schemaPath: string
  readonly setCollapse: (rowID: string, collapsed: boolean) => void
} & {
  readonly attributes: HTMLAttributes<unknown>
  readonly isDragging?: boolean
  readonly listeners: any // SyntheticListenerMap
  readonly setNodeRef: (node: HTMLElement | null) => void
  readonly transform: string
  readonly transition: string
}

const baseClass = 'optionItem'

export const OptionItem: React.FC<Props> = (props) => {
  const {
    attributes,
    listeners,
    parentPath,
    path,
    permissions,
    readOnly,
    removeRow,
    row,
    rowIndex,
    setNodeRef,
    transform,
    transition,
  } = props

  const labelPath = `${path}.label`
  const slugPath = `${path}.slug`
  const optionsPath = `${path}.options`

  const { getDataByPath } = useForm()
  const submitted = useFormSubmitted()

  const { labelField, slugField } = useFormFields(([fields, _]) => {
    return {
      labelField: fields[labelPath],
      slugField: fields[slugPath],
      optionsfield: fields[optionsPath],
    }
  })

  const initialOptions = useMemo(() => {
    return getDataByPath<{ label: string; slug: string }[]>(optionsPath)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getDataByPath, optionsPath, submitted])

  const initialLabel = (labelField?.value as string) ?? ''
  const initialSlug = (slugField?.value as string) ?? ''

  const { dispatchFields, setModified: setModifiedForm } = useForm()

  const [isEditable, setIsEditable] = useState(false)
  const [isModified, setIsModified] = useState(false)

  const [label, setLabel] = useState<string>(initialLabel)
  const [slug, setSlug] = useState<string>(initialSlug)

  const [options, setOptions] = useState<{ label: string; slug: string }[]>(initialOptions)

  useEffect(() => {
    setSlug(slugify(label))
  }, [initialLabel, label])

  const submitChanges = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault()

      if (isModified) {
        dispatchFields({
          type: 'UPDATE',
          value: slug,
          path: slugPath,
        })

        dispatchFields({
          type: 'UPDATE',
          value: label,
          path: labelPath,
        })

        if (!initialOptions || initialOptions.length === 0) {
          options.forEach((option, index) => {
            const subFieldState: FormState = {
              label: {
                value: option.label,
              },
              slug: {
                value: option.slug,
              },
              group: {
                value: slug,
              },
            }

            dispatchFields({
              type: 'ADD_ROW',
              rowIndex: index,
              path: optionsPath,
              subFieldState,
            })
          })
        } else if (options?.length < initialOptions?.length) {
          // Remove extra rows if they don't exist anymore
          for (let rowIndex = initialOptions.length; rowIndex >= options.length; rowIndex--) {
            dispatchFields({ type: 'REMOVE_ROW', path: optionsPath, rowIndex })
          }
        } else {
          const formState: FormState = {}

          options.forEach((option, index) => {
            formState[`${optionsPath}.${index}.label`] = {
              value: option.label,
            }
            formState[`${optionsPath}.${index}.slug`] = {
              value: option.slug,
            }
            formState[`${optionsPath}.${index}.group`] = {
              value: slug,
            }
          })

          dispatchFields({
            type: 'UPDATE_MANY',
            formState: formState,
          })
        }

        setModifiedForm(true)

        setIsModified(false)
        setIsEditable(false)
      }
    },
    [
      isModified,
      dispatchFields,
      slug,
      slugPath,
      label,
      labelPath,
      initialOptions,
      options,
      setModifiedForm,
      optionsPath,
    ],
  )

  const cancelChanges = useCallback(() => {
    setLabel(initialLabel)
    setSlug(initialSlug)
    setOptions(initialOptions ?? [])

    setIsModified(false)
    setIsEditable(false)
  }, [initialLabel, initialOptions, initialSlug])

  const cancelChangesHandler = useCallback<MouseEventHandler>(
    (e) => {
      e.preventDefault()

      cancelChanges()
    },
    [cancelChanges],
  )

  return (
    <div ref={setNodeRef} style={{ transform, transition }} className={`${baseClass}Wrapper`}>
      <Collapsible
        isCollapsed={!isEditable}
        onToggle={(state) => {
          if (state) {
            cancelChanges()
            setIsEditable(false)
          } else {
            setIsEditable(true)
          }
        }}
        dragHandleProps={{ listeners, attributes, id: row.id }}
        header={
          <div className={`${baseClass}Heading`}>
            <div className={`${baseClass}PreviewLabel`}>{label || 'No key'}</div>
            <ul className={`${baseClass}PreviewOptions`}>
              {Array.isArray(options) && options.length > 0 ? (
                options.map((option) => {
                  return (
                    <li className={`${baseClass}PreviewOption`} key={`preview-${option.slug}`}>
                      {option.label}
                    </li>
                  )
                })
              ) : (
                <div className={`${baseClass}PreviewNoOptions`}>No values</div>
              )}
            </ul>
          </div>
        }
        className={`${baseClass}Collapsible`}
      >
        <div className={`${baseClass}Contents`}>
          <OptionLabel
            parentPath={path}
            value={label}
            setValue={setLabel}
            slug={initialSlug}
            description={`Field slug: ${slug}`}
          />

          <OptionsSelector
            suggestionSlug={slug}
            setIsModified={setIsModified}
            setOptions={setOptions}
            options={options}
          />

          <div className={`${baseClass}Actions`}>
            <Button
              type="button"
              onClick={() => removeRow(rowIndex)}
              className={`${baseClass}Delete`}
              buttonStyle="pill"
            >
              <span className="visually-hidden">Remove</span>
              <Trash2Icon />
            </Button>

            <div className={`${baseClass}ActionsGroup`}>
              <Button
                buttonStyle="secondary"
                className={`${baseClass}Cancel`}
                onClick={cancelChangesHandler}
                disabled={!isModified}
              >
                Cancel
              </Button>
              <Button className={`${baseClass}Save`} disabled={!isModified} onClick={submitChanges}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </Collapsible>
    </div>
  )
}
