import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import FormSubmit from '../../forms/Submit';
import { useForm, useFormModified, useWatchForm } from '../../forms/Form/context';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useLocale } from '../../utilities/Locale';
import { Field, Fields } from '../../forms/Form/types';

import './index.scss';
//import fields from '../../views/Version/RenderFieldsToDiff/fields';
//import { Path } from 'slate';


const baseClass = 'save-draft';

const SaveDraft: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig();
  const { submit, setModified } = useForm();
  const { collection, global, id } = useDocumentInfo();
  const modified = useFormModified();
  const locale = useLocale();
  const { t } = useTranslation('version');
  const { getFields } = useWatchForm();

  //console.log(getField('/api/posts/6414e0f2a2c3c8d208b64b47'));
  const canSaveDraft = modified;


  //ARRAYS TO STORE STATES
  let initialValuesArr = [];
  let currentValuesArr = [];


  // FUNCTION TO GENERATE STATE ARRAYS
  const stateArrays = (obj:Fields | Field, property: any, arr: any)  => {
    
    var reRun = null;

    //let val;

    // if (obj instanceof Array) {
    //   for (let i = 0; i < Object.keys(obj).length; i++) {
    //     reRun = stateArrays(obj[i], property, arr);
    //     console.log(`eustachio1`)
    //     if (reRun) {
    //       break;
    //     }
    //   }
    // }
    // else {
    for (const val in obj as Field) {
      // console.log(`eustachio2`)
      if (obj[val] instanceof Array || obj[val] instanceof Object) {
        // console.log(`eustachio3`)
        reRun = stateArrays(obj[val], property, arr);
        if (reRun) {
          break;
        };
      };

      if (obj[property]) {
        if (obj[property] !== undefined) {
          if (val === property) {
            if (obj[property] instanceof Array) {
              for (let i = 0; i < obj[property].length; i++) {
                for (let y = 0; y < obj[property].length; y++) {
                  arr.push(obj[property][y].children[0].text);
                }
                break;
              }
              break;


            }
            else {
              arr.push(obj[property])
            }
          }
        }
      };
    };
    // }
    return reRun;
  }

  // GENERATE STATE ARRAYS
  stateArrays(getFields(), 'initialValue', initialValuesArr);
  stateArrays(getFields(), 'value', currentValuesArr);

  // JOIN-TRIM ARRAYS BEFORE COMPARING
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  console.log(initialValuesArrJoin);
  let currentValuesArrJoin = currentValuesArr.join("").trim();
  console.log(currentValuesArrJoin);


  const compareArrays = useCallback(() => {
    if (initialValuesArrJoin === currentValuesArrJoin) {
      console.log(`state hasn't changed`)
      return setModified(false);
    }
    else {
      console.log(`state has changed`)
      return modified;
    }

  }, [currentValuesArr]);
  
  compareArrays();



  const saveDraft = useCallback(() => {
    const search = `?locale=${locale}&depth=0&fallback-locale=null&draft=true`;
    let action;
    let method = 'POST';

    if (collection) {
      action = `${serverURL}${api}/${collection.slug}${id ? `/${id}` : ''}${search}`;
      if (id) method = 'PATCH';
    }


    if (global) {
      action = `${serverURL}${api}/globals/${global.slug}${search}`;
    }

    submit({
      action,
      method,
      skipValidation: true,
      overrides: {
        _status: 'draft',
      },
    });
  }, [submit, collection, global, serverURL, api, locale, id]);


  return (
    <FormSubmit
      className={baseClass}
      type="button"
      buttonStyle="secondary"
      onClick={saveDraft}
      disabled={!canSaveDraft}
    >
      {t('saveDraft')}
    </FormSubmit>
  );
};

export default SaveDraft;
