'use client'

import { Button, ReactSelect, useTheme } from '@payloadcms/ui'
import { ChevronIcon } from '@payloadcms/ui/icons/Chevron'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'

import './index.css'
import { BannerSection } from './sections/Banner.js'
import { ButtonSection } from './sections/Button.js'
import { CardSection } from './sections/Card.js'
import { CheckboxSection } from './sections/Checkbox.js'
import { CopyToClipboardSection } from './sections/CopyToClipboard.js'
import { DrawerSection } from './sections/DrawerSection.js'
import { DropzoneSection } from './sections/Dropzone.js'
import { IconsSection } from './sections/Icons.js'
import { IDLabelSection } from './sections/IDLabel.js'
import { InputStepperSection } from './sections/InputStepper.js'
import { LexicalIconsSection } from './sections/LexicalIcons.js'
import { LoadingSection } from './sections/LoadingSection.js'
import { LockedSection } from './sections/Locked.js'
import { ModalSection } from './sections/ModalSection.js'
import { NoListResultsSection } from './sections/NoListResults.js'
import { PillSection } from './sections/Pill.js'
import { PopupSection } from './sections/Popup.js'
import { RenderTitleSection } from './sections/RenderTitle.js'
import { SpinnerSection } from './sections/Spinner.js'
import { StatusSection } from './sections/Status.js'
import { StatusCellSection } from './sections/StatusCell.js'
import { ThumbnailCardSection } from './sections/ThumbnailCard.js'
import { ToastSection } from './sections/ToastSection.js'
import { TooltipSection } from './sections/Tooltip.js'
// Field sections
import { CodeFieldSection } from './sections/fields/CodeField.js'
import { DateFieldSection } from './sections/fields/DateField.js'
import { EmailAndUsernameFieldSection } from './sections/fields/EmailAndUsernameField.js'
import { EmailFieldSection } from './sections/fields/EmailField.js'
import { JSONFieldSection } from './sections/fields/JSONField.js'
import { NumberFieldSection } from './sections/fields/NumberField.js'
import { PasswordFieldSection } from './sections/fields/PasswordField.js'
import { PointFieldSection } from './sections/fields/PointField.js'
import { RadioGroupFieldSection } from './sections/fields/RadioGroupField.js'
import { SelectFieldSection } from './sections/fields/SelectField.js'
import { TextareaFieldSection } from './sections/fields/TextareaField.js'
import { TextFieldSection } from './sections/fields/TextField.js'

type CategoryId = 'all' | 'fields' | 'patterns' | 'primitives'

type ComponentId =
  | 'all'
  // Primitives
  | 'banner'
  | 'button'
  | 'card'
  | 'checkbox'
  | 'code-field'
  | 'copy-to-clipboard'
  | 'date-field'
  | 'drawer'
  | 'dropzone'
  | 'email-field'
  | 'email-username-field'
  | 'icons'
  | 'id-label'
  | 'input'
  | 'input-stepper'
  | 'json-field'
  | 'lexical-icons'
  | 'loading-overlay'
  | 'locked'
  // Patterns
  | 'modal'
  | 'no-list-results'
  | 'number-field'
  | 'password-field'
  | 'pill'
  | 'point-field'
  // Fields
  | 'popup'
  | 'radio'
  | 'radiogroup-field'
  | 'render-title'
  | 'select'
  | 'select-field'
  | 'shimmer'
  | 'spinner'
  | 'status'
  | 'status-cell'
  | 'text-field'
  | 'textarea'
  | 'textarea-field'
  | 'thumbnail-card'
  | 'toast'
  | 'tooltip'

type ComponentOption = {
  category: CategoryId
  label: string
  value: ComponentId
}

const componentOptions: ComponentOption[] = [
  // Primitives
  { category: 'primitives', label: 'Banner', value: 'banner' },
  { category: 'primitives', label: 'Button', value: 'button' },
  { category: 'primitives', label: 'Card', value: 'card' },
  { category: 'primitives', label: 'Checkbox', value: 'checkbox' },
  { category: 'primitives', label: 'Copy to Clipboard', value: 'copy-to-clipboard' },
  { category: 'primitives', label: 'Dropzone', value: 'dropzone' },
  { category: 'primitives', label: 'Icons', value: 'icons' },
  { category: 'primitives', label: 'ID Label', value: 'id-label' },
  { category: 'primitives', label: 'Input', value: 'input' },
  { category: 'primitives', label: 'Input Stepper', value: 'input-stepper' },
  { category: 'primitives', label: 'Lexical Icons', value: 'lexical-icons' },
  { category: 'primitives', label: 'Locked', value: 'locked' },
  { category: 'primitives', label: 'Pill', value: 'pill' },
  { category: 'primitives', label: 'Popup', value: 'popup' },
  { category: 'primitives', label: 'Radio', value: 'radio' },
  { category: 'primitives', label: 'Render Title', value: 'render-title' },
  { category: 'primitives', label: 'Select', value: 'select' },
  { category: 'primitives', label: 'Spinner', value: 'spinner' },
  { category: 'primitives', label: 'Textarea', value: 'textarea' },
  { category: 'primitives', label: 'Tooltip', value: 'tooltip' },
  // Patterns
  { category: 'patterns', label: 'Drawer', value: 'drawer' },
  { category: 'patterns', label: 'Loading Overlay', value: 'loading-overlay' },
  { category: 'patterns', label: 'Modal', value: 'modal' },
  { category: 'patterns', label: 'No List Results', value: 'no-list-results' },
  { category: 'patterns', label: 'Shimmer / Loading', value: 'shimmer' },
  { category: 'patterns', label: 'Status', value: 'status' },
  { category: 'patterns', label: 'Status Cell', value: 'status-cell' },
  { category: 'patterns', label: 'Thumbnail Card', value: 'thumbnail-card' },
  { category: 'patterns', label: 'Toast', value: 'toast' },
  // Fields
  { category: 'fields', label: 'Code Field', value: 'code-field' },
  { category: 'fields', label: 'Date Field', value: 'date-field' },
  { category: 'fields', label: 'Email Field', value: 'email-field' },
  { category: 'fields', label: 'Email & Username', value: 'email-username-field' },
  { category: 'fields', label: 'JSON Field', value: 'json-field' },
  { category: 'fields', label: 'Number Field', value: 'number-field' },
  { category: 'fields', label: 'Password Field', value: 'password-field' },
  { category: 'fields', label: 'Point Field', value: 'point-field' },
  { category: 'fields', label: 'Radio Group Field', value: 'radiogroup-field' },
  { category: 'fields', label: 'Select Field', value: 'select-field' },
  { category: 'fields', label: 'Text Field', value: 'text-field' },
  { category: 'fields', label: 'Textarea Field', value: 'textarea-field' },
]

const categories: { label: string; value: CategoryId }[] = [
  { label: 'All', value: 'all' },
  { label: 'Primitives', value: 'primitives' },
  { label: 'Patterns', value: 'patterns' },
  { label: 'Fields', value: 'fields' },
]

export const ComponentsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all')
  const [selectedComponent, setSelectedComponent] = useState<ComponentId>('all')
  const { setTheme, theme } = useTheme()

  const filteredComponents = useMemo(() => {
    if (selectedCategory === 'all') {
      return componentOptions
    }
    return componentOptions.filter((c) => c.category === selectedCategory)
  }, [selectedCategory])

  const handleCategoryChange = (category: CategoryId) => {
    setSelectedCategory(category)
    setSelectedComponent('all')
  }

  const shouldShow = (id: ComponentId, category: CategoryId): boolean => {
    if (selectedComponent !== 'all') {
      return selectedComponent === id
    }
    if (selectedCategory !== 'all') {
      return selectedCategory === category
    }
    return true
  }

  return (
    <div className="components-view">
      <div className="components-view__header">
        <Link className="components-view__back" href="/admin">
          <ChevronIcon direction="left" size={16} />
          Back to Dashboard
        </Link>
        <h1>Component Gallery</h1>
        <p className="components-view__description">
          Preview UI components from <code>@payloadcms/ui</code> with various prop combinations.
        </p>

        <div className="components-view__controls">
          <div className="components-view__control-group">
            <label>Category:</label>
            <ReactSelect
              isClearable={false}
              onChange={(option) => {
                if (option && 'value' in option) {
                  handleCategoryChange(option.value as CategoryId)
                }
              }}
              options={categories}
              value={categories.find((c) => c.value === selectedCategory)}
            />
          </div>

          <div className="components-view__control-group">
            <label>Component:</label>
            <ReactSelect
              isClearable={false}
              onChange={(option) => {
                if (option && 'value' in option) {
                  setSelectedComponent(option.value as ComponentId)
                }
              }}
              options={[{ label: 'All in category', value: 'all' }, ...filteredComponents]}
              value={
                selectedComponent === 'all'
                  ? { label: 'All in category', value: 'all' }
                  : filteredComponents.find((c) => c.value === selectedComponent)
              }
            />
          </div>

          <div className="components-view__control-group">
            <label>Theme:</label>
            <Button
              buttonStyle="secondary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </Button>
          </div>
        </div>
      </div>

      <div className="components-view__content">
        {/* Primitives */}
        {(selectedCategory === 'all' || selectedCategory === 'primitives') &&
          selectedComponent === 'all' && (
            <h2 className="components-view__category-title">Primitives</h2>
          )}
        {shouldShow('button', 'primitives') && <ButtonSection selectedComponent="button" />}
        {shouldShow('pill', 'primitives') && <PillSection selectedComponent="pill" />}
        {shouldShow('icons', 'primitives') && <IconsSection selectedComponent="icons" />}
        {shouldShow('id-label', 'primitives') && <IDLabelSection selectedComponent="id-label" />}
        {shouldShow('render-title', 'primitives') && (
          <RenderTitleSection selectedComponent="render-title" />
        )}
        {shouldShow('lexical-icons', 'primitives') && (
          <LexicalIconsSection selectedComponent="lexical-icons" />
        )}
        {shouldShow('tooltip', 'primitives') && <TooltipSection selectedComponent="tooltip" />}
        {shouldShow('popup', 'primitives') && <PopupSection selectedComponent="popup" />}
        {shouldShow('card', 'primitives') && <CardSection selectedComponent="card" />}
        {shouldShow('dropzone', 'primitives') && <DropzoneSection selectedComponent="dropzone" />}
        {shouldShow('copy-to-clipboard', 'primitives') && (
          <CopyToClipboardSection selectedComponent="copy-to-clipboard" />
        )}
        {shouldShow('banner', 'primitives') && <BannerSection selectedComponent="banner" />}
        {shouldShow('locked', 'primitives') && <LockedSection selectedComponent="locked" />}
        {shouldShow('input-stepper', 'primitives') && (
          <InputStepperSection selectedComponent="input-stepper" />
        )}
        {shouldShow('spinner', 'primitives') && <SpinnerSection selectedComponent="spinner" />}

        {/* Patterns */}
        {(selectedCategory === 'all' || selectedCategory === 'patterns') &&
          selectedComponent === 'all' && (
            <h2 className="components-view__category-title">Patterns</h2>
          )}
        {shouldShow('drawer', 'patterns') && <DrawerSection selectedComponent="drawer" />}
        {shouldShow('loading-overlay', 'patterns') && (
          <LoadingSection selectedComponent="loading-overlay" />
        )}
        {shouldShow('modal', 'patterns') && <ModalSection selectedComponent="modal" />}
        {shouldShow('thumbnail-card', 'patterns') && (
          <ThumbnailCardSection selectedComponent="thumbnail-card" />
        )}
        {shouldShow('toast', 'patterns') && <ToastSection selectedComponent="toast" />}
        {shouldShow('no-list-results', 'patterns') && (
          <NoListResultsSection selectedComponent="no-list-results" />
        )}
        {shouldShow('status', 'patterns') && <StatusSection selectedComponent="status" />}
        {shouldShow('status-cell', 'patterns') && (
          <StatusCellSection selectedComponent="status-cell" />
        )}

        {/* Fields */}
        {(selectedCategory === 'all' || selectedCategory === 'fields') &&
          selectedComponent === 'all' && (
            <h2 className="components-view__category-title">Input Fields</h2>
          )}
        {shouldShow('text-field', 'fields') && <TextFieldSection />}
        {shouldShow('email-field', 'fields') && <EmailFieldSection />}
        {shouldShow('email-username-field', 'fields') && <EmailAndUsernameFieldSection />}
        {shouldShow('number-field', 'fields') && <NumberFieldSection />}
        {shouldShow('password-field', 'fields') && <PasswordFieldSection />}
        {shouldShow('point-field', 'fields') && <PointFieldSection />}
        {shouldShow('select-field', 'fields') && <SelectFieldSection />}
        {shouldShow('date-field', 'fields') && <DateFieldSection />}
        {shouldShow('textarea-field', 'fields') && <TextareaFieldSection />}
        {shouldShow('checkbox', 'primitives') && <CheckboxSection selectedComponent="checkbox" />}
        {shouldShow('radiogroup-field', 'fields') && <RadioGroupFieldSection />}
        {shouldShow('json-field', 'fields') && <JSONFieldSection />}
        {shouldShow('code-field', 'fields') && <CodeFieldSection />}
      </div>
    </div>
  )
}

export default ComponentsView
