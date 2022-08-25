import { Field, FieldHook } from '../../../../../src/fields/config/types';
import { CollectionConfig } from '../../../../../src/collections/config/types';

export interface hookArgs {
  targetCollection: CollectionConfig;
  backpopulatedField: Field;
  originalField: Field;
}


export interface polymorphicHookArgs {
  // polymorphic hooks need to be aware of their own slug, otherwise
  // we can not determine if the document is part of the afterchange value
  primaryCollection: CollectionConfig;
  targetCollection: CollectionConfig;
  backpopulatedField: Field;
}


const backpopulate: FieldHook = (args) => {
  /**
   * This is just a marker hook and will be replaced by the plugin.
   * Using this marker hook allows to simply use 'backpopulate' as a hook name in the config.
   */
  return args.value;
};

export default backpopulate;
