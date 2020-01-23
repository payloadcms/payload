import React, { Component, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'universal-cookie';
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

class Relationship extends Component {
  constructor(props) {
    super(props);

    const { relationTo, hasMultipleRelations } = this.props;
    const relations = hasMultipleRelations ? relationTo : [relationTo];

    this.state = {
      relations,
      results: relations.reduce((acc, relation) => ({
        ...acc,
        [relation]: {
          docs: [],
          totalPages: null,
          page: 1,
        }
      }), {}),
      options: [],
    };
  }

  // Get initial options to populate ReactSelect
  // At first, only load the first 10 of the first related model
  componentDidMount() {
    const { relations } = this.state;
    const token = cookies.get('token');

    relations.forEach((relation) => {
      fetch(`${serverURL}/${relation}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((res) => {
        res.json().then((json) => {
          const updatedResults = this.addResults(json, relation);
          const formattedOptions = this.formatOptions(updatedResults);

          this.setState({
            results: updatedResults,
            options: formattedOptions,
          })
        })
      })
    })
  }

  // This is needed to reduce the selected option to only its value
  // Essentially, remove the label
  formatSelectedValue = (selectedValue) => {
    return selectedValue ? selectedValue.value : selectedValue;
  }

  // When ReactSelect prepopulates a selected option,
  // if there are multiple relations, we need to find a nested option to match from
  findValueInOptions = (options, value) => {
    const { hasMultipleRelations } = this.props;

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
    } else {
      foundValue = options.find(option => option.value === value);
    }

    return foundValue;
  }

  // Build and maintain a list of all results, keyed by collection type
  // Note - this is different than options so that we can easily keep current page and total pages
  addResults = (incoming, relation) => {
    const { results } = this.state;

    return {
      ...results,
      [relation]: {
        totalPages: incoming.totalPages,
        page: incoming.page,
        docs: [
          ...results[relation].docs,
          ...incoming.docs,
        ]
      }
    }
  }

  // Convert results into a ReactSelect-friendly array of options
  formatOptions = (results) => {
    const { hasMultipleRelations } = this.props;

    return Object.keys(results).sort().reduce((acc, collectionSlug) => {
      const collectionResults = results[collectionSlug].docs;
      const collectionConfig = collections.find((collection) => collection.slug === collectionSlug);
      const optionGroup = {
        label: collectionConfig.labels.plural,
        options: collectionResults.map((result) => ({
          label: result[collectionConfig.useAsTitle],
          value: hasMultipleRelations ? {
            relationTo: collectionConfig.slug,
            value: result.id,
          } : result.id,
        })),
      };

      acc.push(optionGroup);
      return acc;
    }, []);
  }

  handleMenuScrollToBottom = () => {
    console.log('scrolled');
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
          onChange={onFieldChange}
          formatValue={this.formatSelectedValue}
          onMenuScrollToBottom={this.handleMenuScrollToBottom}
          findValueInOptions={this.findValueInOptions}
          value={value}
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
    PropTypes.arrayOf(
      PropTypes.shape({}),
    ),
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
      let incomingRelatedDocument = valueToFormat;
      let relatedCollection = collections.find(collection => relationTo === collection.slug);

      if (hasMultipleRelations) {
        incomingRelatedDocument = valueToFormat.value
        relatedCollection = collections.find(collection => valueToFormat.relationTo === collection.slug);
      }

      return {
        label: incomingRelatedDocument[relatedCollection.useAsTitle],
        value: incomingRelatedDocument.id,
      }
    }

    if (defaultValue) {
      if (hasMany && Array.isArray(defaultValue)) {
        let formattedDefaultValue = [];
        defaultValue.forEach((individualValue) => {
          formattedDefaultValue.push(formatDefaultValue(individualValue));
          setFormattedDefaultValue(formattedDefaultValue);
        })
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
