import React, { MouseEventHandler, useCallback } from 'react';
import Select, {
  components as SelectComponents,
  MultiValueProps,
  Props as SelectProps,
} from 'react-select';
import {
  SortableContainer,
  SortableContainerProps,
  SortableElement,
  SortStartHandler,
  SortEndHandler,
  SortableHandle,
} from 'react-sortable-hoc';
import { useTranslation } from 'react-i18next';
import { arrayMove } from '../../../../utilities/arrayMove';
import { Props, Option as OptionType } from './types';
import Chevron from '../../icons/Chevron';
import { getTranslation } from '../../../../utilities/getTranslation';

import './index.scss';

const SortableMultiValue = SortableElement(
  (props: MultiValueProps<OptionType>) => {
    // this prevents the menu from being opened/closed when the user clicks
    // on a value to begin dragging it. ideally, detecting a click (instead of
    // a drag) would still focus the control and toggle the menu, but that
    // requires some magic with refs that are out of scope for this example
    const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const classes = [
      props.className,
      !props.isDisabled && 'draggable',
    ].filter(Boolean).join(' ');

    return (
      <SelectComponents.MultiValue
        {...props}
        className={classes}
        innerProps={{ ...props.innerProps, onMouseDown }}
      />
    );
  },
);


const SortableMultiValueLabel = SortableHandle((props) => <SelectComponents.MultiValueLabel {...props} />);

const SortableSelect = SortableContainer(Select) as React.ComponentClass<SelectProps<OptionType, true> & SortableContainerProps>;

const ReactSelect: React.FC<Props> = (props) => {
  const { t, i18n } = useTranslation();

  const {
    className,
    showError = false,
    options,
    onChange,
    value,
    disabled = false,
    placeholder = t('general:selectValue'),
    isSearchable = true,
    isClearable = true,
    isMulti,
    isSortable,
    filterOption = undefined,
    isLoading,
    onMenuOpen,
    components,
  } = props;

  const classes = [
    className,
    'react-select',
    showError && 'react-select--error',
  ].filter(Boolean).join(' ');

  const onSortStart: SortStartHandler = useCallback(({ helper }) => {
    const portalNode = helper;
    if (portalNode && portalNode.style) {
      portalNode.style.cssText += 'pointer-events: auto; cursor: grabbing;';
    }
  }, []);

  const onSortEnd: SortEndHandler = useCallback(({ oldIndex, newIndex }) => {
    onChange(arrayMove(value as OptionType[], oldIndex, newIndex));
  }, [onChange, value]);

  if (isMulti && isSortable) {
    return (
      <SortableSelect
        useDragHandle
        // react-sortable-hoc props:
        axis="xy"
        onSortStart={onSortStart}
        onSortEnd={onSortEnd}
        // small fix for https://github.com/clauderic/react-sortable-hoc/pull/352:
        getHelperDimensions={({ node }) => node.getBoundingClientRect()}
        // react-select props:
        placeholder={getTranslation(placeholder, i18n)}
        {...props}
        value={value as OptionType[]}
        onChange={onChange}
        disabled={disabled ? 'disabled' : undefined}
        className={classes}
        classNamePrefix="rs"
        captureMenuScroll
        options={options}
        isSearchable={isSearchable}
        isClearable={isClearable}
        isLoading={isLoading}
        onMenuOpen={onMenuOpen}
        filterOption={filterOption}
        components={{
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore We're failing to provide a required index prop to SortableElement
          MultiValue: SortableMultiValue,
          MultiValueLabel: SortableMultiValueLabel,
          DropdownIndicator: Chevron,
          ...components,
        }}
      />
    );
  }

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
      components={{
        DropdownIndicator: Chevron,
        ...components,
      }}
    />
  );
};

export default ReactSelect;
