import React, { Component, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
import some from 'async-some';
import ReactSelect from '../../../modules/ReactSelect';
import useFieldType from '../../useFieldType';
import getSanitizedConfig from '../../../../config/getSanitizedConfig';
import Label from '../../Label';
import Error from '../../Error';

import './index.scss';

const cookies = new Cookies();

const { serverURL, collections } = getSanitizedConfig();

const defaultError = 'Please make a selection.';
const defaultValidate = value => value.length > 0;

const maxResultsPerRequest = 10;

class Relationship extends Component {
  constructor(props) {
    super(props);

    const { relationTo, hasMultipleRelations } = this.props;
    const relations = hasMultipleRelations ? relationTo : [relationTo];

    this.state = {
      relations,
      search: '',
      lastFullyLoadedRelation: -1,
      lastLoadedPage: 1,
      options: [],
    };
  }

  componentDidMount() {
    this.getNextOptions();
  }

  getNextOptions = () => {
    const { relations, lastFullyLoadedRelation, lastLoadedPage } = this.state;
    const token = cookies.get('token');

    const relationsToSearch = relations.slice(lastFullyLoadedRelation + 1);

    if (relationsToSearch.length > 0) {
      some(relationsToSearch, async (relation, callback) => {
        const response = await fetch(`${serverURL}/${relation}?limit=${maxResultsPerRequest}&page=${lastLoadedPage}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.hasNextPage) {
          return callback(false, {
            data,
            relation,
          })
        }

        callback({ relation, data });
      }, (lastPage, nextPage) => {
        if (nextPage) {
          const { data, relation } = nextPage;
          this.addOptions(data, relation);
        } else {
          const { data, relation } = lastPage;
          this.addOptions(data, relation);
          this.setState({
            lastFullyLoadedRelation: relations.indexOf(relation),
            lastLoadedPage: 1,
          })
        }

      })
    }
  }

  // This is needed to reduce the selected option to only its value
  // Essentially, remove the label
  formatSelectedValue = (selectedValue) => {
    const { hasMany } = this.props;

    if (hasMany && Array.isArray(selectedValue)) {
      return selectedValue.map(val => val.value);
    }

    return selectedValue ? selectedValue.value : selectedValue;
  }

  // When ReactSelect prepopulates a selected option,
  // if there are multiple relations, we need to find a nested option to match from
  findValueInOptions = (options, value) => {
    const { hasMultipleRelations, hasMany } = this.props;

    let foundValue = false;

    if (hasMultipleRelations) {
      options.forEach((option) => {
        const potentialValue = option.options.find((subOption) => {
          if (subOption.value && subOption.value.value && value && value.value) {
            return subOption.value.value === value.value;
          }

          return false;
        });

        if (potentialValue) foundValue = potentialValue;
      });
    } else if (value) {
      if (hasMany) {
        foundValue = value.map(val => options.find(option => option.value === val));
      } else {
        foundValue = options.find(option => option.value === value);
      }
    }

    return foundValue || null;
  }

  addOptions = (data, relation) => {
    const { hasMultipleRelations } = this.props;
    const { lastLoadedPage, options } = this.state;
    const collection = collections.find(collection => collection.slug === relation);

    if (!hasMultipleRelations) {
      this.setState({
        options: [
          ...options,
          ...data.docs.map((doc) => ({
            label: doc[collection.useAsTitle],
            value: doc.id,
          }))
        ],
      });
    } else {
      const allOptionGroups = [...options];
      const optionsToAddTo = allOptionGroups.find(optionGroup => optionGroup.label === collection.labels.plural);

      const newOptions = data.docs.map((doc) => {
        return {
          label: doc[collection.useAsTitle],
          value: {
            relationTo: collection.slug,
            value: doc.id,
          }
        }
      })

      if (optionsToAddTo) {
        optionsToAddTo.options = [
          ...optionsToAddTo.options,
          ...newOptions,
        ];
      } else {
        allOptionGroups.push({
          label: collection.labels.plural,
          options: newOptions,
        });
      }

      this.setState({
        options: [
          ...allOptionGroups,
        ],
      })
    }

    this.setState({
      lastLoadedPage: lastLoadedPage + 1,
    });
  }

  handleInputChange = (search) => {
    this.setState({
      search
    })
  }

  handleMenuScrollToBottom = () => {
    this.getNextOptions();
  }

  render() {
    const { options } = this.state;

    const {
      name,
      required,
      style,
      width,
      errorMessage,
      label,
      hasMany,
      value,
      showError,
      formProcessing,
      onFieldChange,
    } = this.props;

    const classes = [
      'field-type',
      'relationship',
      showError && 'error',
    ].filter(Boolean).join(' ');

    // eslint-disable-next-line prefer-template
    const fieldWidth = width ? width + '%' : null;

    const valueToRender = this.findValueInOptions(options, value);

    /////////////////////////////////////////////
    // TODO: simplify formatValue pattern seen below with react select
    /////////////////////////////////////////////

    return (
      <div
        className={classes}
        style={{
          ...style,
          width: fieldWidth,
        }}
      >
        <Error
          showError={showError}
          message={errorMessage}
        />
        <Label
          htmlFor={name}
          label={label}
          required={required}
        />
        <ReactSelect
          onInputChange={this.handleInputChange}
          onChange={onFieldChange}
          formatValue={this.formatSelectedValue}
          onMenuScrollToBottom={this.handleMenuScrollToBottom}
          findValueInOptions={this.findValueInOptions}
          value={valueToRender}
          showError={showError}
          disabled={formProcessing}
          options={options}
          isMulti={hasMany}
        />
      </div>
    );
  }
}

Relationship.defaultProps = {
  style: {},
  required: false,
  errorMessage: defaultError,
  hasMany: false,
  width: 100,
  showError: false,
  value: null,
  formProcessing: false,
};

Relationship.propTypes = {
  relationTo: PropTypes.oneOfType([
    PropTypes.oneOf(Object.keys(collections).map((key) => {
      return collections[key].slug;
    })),
    PropTypes.arrayOf(
      PropTypes.oneOf(Object.keys(collections).map((key) => {
        return collections[key].slug;
      })),
    ),
  ]).isRequired,
  required: PropTypes.bool,
  style: PropTypes.shape({}),
  errorMessage: PropTypes.string,
  showError: PropTypes.bool,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  formProcessing: PropTypes.bool,
  width: PropTypes.number,
  hasMany: PropTypes.bool,
  onFieldChange: PropTypes.func.isRequired,
  hasMultipleRelations: PropTypes.bool.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.shape({}),
  ]),
};

const RelationshipFieldType = (props) => {
  const [formattedDefaultValue, setFormattedDefaultValue] = useState(null);
  const { defaultValue, relationTo, hasMany } = props;
  const hasMultipleRelations = Array.isArray(relationTo);

  const fieldType = useFieldType({
    ...props,
    defaultValue: formattedDefaultValue,
  });

  useEffect(() => {
    const formatDefaultValue = (valueToFormat) => {
      if (hasMultipleRelations) {
        return {
          ...valueToFormat,
          value: valueToFormat.value.id
        };
      }

      return valueToFormat.id;
    }

    if (defaultValue) {
      if (hasMany && Array.isArray(defaultValue)) {
        let formattedDefaultValue = [];
        defaultValue.forEach((individualValue) => {
          formattedDefaultValue.push(formatDefaultValue(individualValue));
        })
        setFormattedDefaultValue(formattedDefaultValue);
      } else {
        setFormattedDefaultValue(formatDefaultValue(defaultValue));
      };
    }
  }, [defaultValue]);

  return (
    <Relationship
      {...props}
      {...fieldType}
      hasMultipleRelations={hasMultipleRelations}
    />
  );
};

RelationshipFieldType.defaultProps = {
  validate: defaultValidate,
};

RelationshipFieldType.propTypes = {
  validate: PropTypes.func,
};

export default RelationshipFieldType;
