import React, { useCallback, useId } from 'react';
import {
  DragEndEvent,
  useDroppable,
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Props } from './types';
import Chevron from '../../icons/Chevron';
import { getTranslation } from '../../../../utilities/getTranslation';
import { SingleValue } from './SingleValue';
import { MultiValueLabel } from './MultiValueLabel';
import { MultiValue } from './MultiValue';
import { ValueContainer } from './ValueContainer';
import { ClearIndicator } from './ClearIndicator';
import { MultiValueRemove } from './MultiValueRemove';
import { Control } from './Control';
import './index.scss';

const SelectAdapter: React.FC<Props> = (props) => {
  const { t, i18n } = useTranslation();

  const {
    className,
    showError,
    options,
    onChange,
    value,
    disabled = false,
    placeholder = t('general:selectValue'),
    isSearchable = true,
    isClearable = true,
    filterOption = undefined,
    isLoading,
    onMenuOpen,
    components,
    droppableRef,
    selectProps,
  } = props;

  const classes = [
    className,
    'react-select',
    showError && 'react-select--error',
  ].filter(Boolean).join(' ');

  return (
    <Select
      isLoading={isLoading}
      placeholder={getTranslation(placeholder, i18n)}
      captureMenuScroll
      {...props}
      value={value}
      onChange={onChange}
      disabled={disabled ? 'disabled' : undefined}
      className={classes}
      classNamePrefix="rs"
      options={options}
      isSearchable={isSearchable}
      isClearable={isClearable}
      filterOption={filterOption}
      onMenuOpen={onMenuOpen}
      selectProps={{
        ...selectProps,
        droppableRef,
      }}
      components={{
        ValueContainer,
        SingleValue,
        MultiValue,
        MultiValueLabel,
        MultiValueRemove,
        DropdownIndicator: Chevron,
        ClearIndicator,
        Control,
        ...components,
      }}
    />
  );
};

const SortableSelect: React.FC<Props> = (props) => {
  const {
    onChange,
    value,
  } = props;

  const uuid = useId();

  const { setNodeRef } = useDroppable({
    id: uuid,
  });

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!active || !over) return;

    let sorted = value;

    if (value && Array.isArray(value)) {
      const oldIndex = value.findIndex((item) => item.value === active.id);
      const newIndex = value.findIndex((item) => item.value === over.id);
      sorted = arrayMove(value, oldIndex, newIndex);
    }

    onChange(sorted);
  }, [onChange, value]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  let ids: string[] = [];
  if (value) ids = Array.isArray(value) ? value.map((item) => item?.value as string) : [value?.value as string]; // TODO: fix these types

  return (
    <DndContext
      onDragEnd={onDragEnd}
      sensors={sensors}
      collisionDetection={closestCenter}
    >
      <SortableContext items={ids}>
        <SelectAdapter
          {...props}
          droppableRef={setNodeRef}
        />
      </SortableContext>
    </DndContext>
  );
};

const ReactSelect: React.FC<Props> = (props) => {
  const {
    isMulti,
    isSortable,
  } = props;

  if (isMulti && isSortable) {
    return (
      <SortableSelect {...props} />
    );
  }

  return (
    <SelectAdapter {...props} />
  );
};

export default ReactSelect;
