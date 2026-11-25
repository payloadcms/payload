'use client'

import type { TextInputProps } from '@payloadcms/ui'
import type { ValueWithRelation } from 'payload'

import {
  APIKeyInput,
  CheckboxInput,
  CodeEditorLazy as CodeEditor,
  DatePicker,
  InputStepper,
  ReactSelect,
  RelationshipInput,
  SearchInput,
  SelectInput,
  TextareaInput,
  TextInput,
  TimezonePicker,
  UploadInput,
  useConfig,
  useForm,
} from '@payloadcms/ui'
import React, { useState } from 'react'

import { textFieldsSlug, uploadsSlug } from '../../slugs.js'

const selectOptions = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
]
const relationshipCollections = [textFieldsSlug]
const timezoneOptions = [
  { label: 'UTC', value: 'UTC' },
  { label: 'London', value: 'Europe/London' },
]
const codeOptions = { ariaLabel: 'Standalone code', minimap: { enabled: false } }
const jsonOptions = { ariaLabel: 'Standalone JSON', minimap: { enabled: false } }

export function StandaloneInputs() {
  const { config } = useConfig()
  const [text, setText] = useState('')
  const [textarea, setTextarea] = useState('')
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [reactSelection, setReactSelection] = useState('')
  const [checked, setChecked] = useState(false)
  const [selection, setSelection] = useState('')
  const [tags, setTags] = useState<NonNullable<TextInputProps['valueToRender']>>([])
  const [relationship, setRelationship] = useState<null | ValueWithRelation>(null)
  const [upload, setUpload] = useState<null | number | string>(null)
  const [date, setDate] = useState('2026-11-24T12:00:00.000Z')
  const [timezone, setTimezone] = useState('UTC')
  const [code, setCode] = useState('const value = 1;')
  const [json, setJSON] = useState('{"value":1}')
  const [stepper, setStepper] = useState(0)

  return (
    <div className="standalone-inputs">
      <h1>Standalone field inputs</h1>
      <TextInput
        AfterInput={<FormContextProbe />}
        label="Standalone text"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setText(event.target.value)}
        path="standaloneText"
        value={text}
      />
      <TextareaInput
        AfterInput={<FormContextProbe />}
        label="Standalone textarea"
        onChange={(event) => setTextarea(event.target.value)}
        path="standaloneTextarea"
        value={textarea}
      />
      <CheckboxInput
        AfterInput={<FormContextProbe />}
        checked={checked}
        label="Standalone checkbox"
        onToggle={(event) => setChecked(event.target.checked)}
      />
      <SelectInput
        AfterInput={<FormContextProbe />}
        label="Standalone select"
        name="standaloneSelect"
        onChange={(option) =>
          setSelection(option && !Array.isArray(option) ? String(option.value) : '')
        }
        options={selectOptions}
        path="standaloneSelect"
        value={selection}
      />
      <TextInput
        AfterInput={<FormContextProbe />}
        hasMany
        label="Standalone tags"
        onChange={(selected) => setTags(Array.isArray(selected) ? selected : [])}
        path="standaloneTags"
        valueToRender={tags}
      />
      <RelationshipInput
        AfterInput={<FormContextProbe />}
        allowCreate={false}
        hasMany={false}
        label="Standalone relationship"
        onChange={setRelationship}
        path="standaloneRelationship"
        relationTo={relationshipCollections}
        value={relationship}
      />
      <UploadInput
        AfterInput={<FormContextProbe />}
        allowCreate={false}
        api={config.routes.api}
        label="Standalone upload"
        onChange={setUpload}
        path="standaloneUpload"
        relationTo={uploadsSlug}
        serverURL={config.serverURL}
        value={upload ?? undefined}
      />
      <section aria-label="Standalone date picker">
        <label htmlFor="standaloneDate">Standalone date</label>
        <DatePicker
          displayFormat="yyyy-MM-dd"
          onChange={(nextDate) => setDate(nextDate?.toISOString() ?? '')}
          overrides={{ id: 'standaloneDate' }}
          value={date}
        />
        <FormContextProbe />
        <output aria-label="Standalone date value">{date}</output>
      </section>
      <section aria-label="Standalone timezone picker">
        <TimezonePicker
          id="standaloneTimezone"
          onChange={setTimezone}
          options={timezoneOptions}
          selectedTimezone={timezone}
        />
        <FormContextProbe />
        <output aria-label="Standalone timezone value">{timezone}</output>
      </section>
      <section aria-label="Standalone code editor">
        <CodeEditor
          defaultLanguage="javascript"
          onChange={(value) => setCode(value ?? '')}
          options={codeOptions}
          value={code}
        />
        <FormContextProbe />
        <output aria-label="Standalone code value">{code}</output>
      </section>
      <section aria-label="Standalone JSON editor">
        <CodeEditor
          defaultLanguage="json"
          onChange={(value) => setJSON(value ?? '')}
          options={jsonOptions}
          value={json}
        />
        <FormContextProbe />
        <output aria-label="Standalone JSON value">{json}</output>
      </section>
      <section aria-label="Standalone input stepper">
        <InputStepper
          onDecrement={() => setStepper((value) => value - 1)}
          onIncrement={() => setStepper((value) => value + 1)}
        />
        <FormContextProbe />
        <output aria-label="Standalone stepper value">{stepper}</output>
      </section>
      <section aria-label="Standalone search control">
        <SearchInput
          aria-label="Standalone search"
          onChange={setSearch}
          onClear={() => setSearch('')}
          onSearch={setSubmittedSearch}
          value={search}
        />
        <FormContextProbe />
        <output aria-label="Standalone search value">{submittedSearch}</output>
      </section>
      <section aria-label="Standalone API key control">
        <APIKeyInput aria-label="Standalone API key" value="standalone-test-key" />
        <FormContextProbe />
      </section>
      <section aria-label="Standalone ReactSelect control">
        <label htmlFor="standaloneReactSelect">Standalone ReactSelect</label>
        <ReactSelect
          inputId="standaloneReactSelect"
          isClearable
          onChange={(option) =>
            setReactSelection(option && !Array.isArray(option) ? String(option.value) : '')
          }
          options={selectOptions}
          value={selectOptions.find((option) => option.value === reactSelection) ?? []}
        />
        <FormContextProbe />
        <output aria-label="Standalone ReactSelect value">{reactSelection}</output>
      </section>
      <output aria-label="Standalone select value">{selection}</output>
      <output aria-label="Standalone tag values">{tags.map((tag) => tag.label).join(', ')}</output>
      <output aria-label="Standalone relationship value">
        {String(relationship?.value ?? '')}
      </output>
      <output aria-label="Standalone upload value">{upload ?? ''}</output>
    </div>
  )
}

function FormContextProbe() {
  const form = useForm()

  return (
    <span data-testid="standalone-form-context" hidden>
      {form?.uuid || typeof form?.getFields === 'function' ? 'present' : 'absent'}
    </span>
  )
}
