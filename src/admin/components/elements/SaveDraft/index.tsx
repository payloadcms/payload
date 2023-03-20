import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../../utilities/Config';
import FormSubmit from '../../forms/Submit';
import { useForm, useFormModified, useWatchForm } from '../../forms/Form/context';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import { useLocale } from '../../utilities/Locale';
import { Field, Fields } from '../../forms/Form/types';

import './index.scss';


const baseClass = 'save-draft';

const SaveDraft: React.FC = () => {
  const { serverURL, routes: { api } } = useConfig();
  const { submit } = useForm();
  const { collection, global, id } = useDocumentInfo();
  const modified = useFormModified();
  const locale = useLocale();
  const { t } = useTranslation('version');
  const { getFields, setModified } = useWatchForm();

  //console.log(getField('/api/posts/6414e0f2a2c3c8d208b64b47'));
  const canSaveDraft = modified;

  let canSave = false;
  
  // testing 4
  
  //ARRAYS TO STORE STATES
  let initialValuesArr = [];
  let currentValuesArr = [];


  // FUNCTION TO GENERATE STATE ARRAYS
  const stateArrays = (obj:Fields | Field, property: any, arr: any)  => {
    
    var reRun = null;

    let val;

    if (obj instanceof Array) {
      for (let i = 0; i < Object.keys(obj).length; i++) {
        reRun = stateArrays(obj[i], property, arr);
        if (reRun) {
          break;
        }
      }
    }
    else {
      for (val in obj as Field) {
        if (obj[val] instanceof Array || obj[val] instanceof Object) {
          reRun = stateArrays(obj[val], property, arr);
          if (reRun) {
            break;
          };
          // break;
        };

        if (obj[property]) {
          if (obj[property] !== undefined) {
            //const val2 = obj[property];
            //console.log(obj[property]);
            //break;
            if (val === property) {
              if (obj[property] instanceof Array) {
                //console.log(`eustachio`)
                //console.log(obj[property])
                //findFieldValues(obj, property, 'text', arr);
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
            //arr.push(obj[property]);
            // if (val === property || val === 'text') {
              
              //   break;
              // }
              //arr.push(obj[property])
              //stateArrays(obj[property], property, arr)
              //console.log(obj[property])
              //const value = obj[val]
              // if (reRun) {
                //   break;
                // }
                // if (Array.isArray(obj[property])) {
                  //   if(val === 'valid') {
                    //     arr.push(`there is an array`)
                    //   }
                    //   else {
                      
                      //   }
                      // }
              //if (val === property) {

              // for (const val2 in obj[val]) {
              //   if (obj[val] instanceof Array === false) {
              //     //console.log(obj[val])
              //     //arr.push(obj[val]);
              //     break;
              //   }
              //   else {
              //     //console.log
              //     //arr.push(obj[val][val2]);
              //     //console.log(obj[val][val2])
              //   }
              // }
              
              
              
              
              
              
            //}
            //break;
            }
            //break;
          };
        };

      }
    return reRun;
  }

  // FUNCTION TO ALTER ARRAY - FIND UNIQUE KEYS LIKE 'text' WHEN NESTED ARRAYS
  type nestedFields = {
    text: string;
    property?: string;
  }
  type arrayFields = {
    text: string;
    children?: arrayFields[];
  }



  interface OBJ {
    type1: string;
    type2: number;
    type3: boolean;
  }

  //console.log(getFields())

  // let testingArr = [];
  // const generateArrays = (obj) => {

  //   for (const [k, v] of Object.entries(obj)) {
  //     const value = obj[v];
  //     const key = obj[k];
  //     testingArr.push(obj[key]);
  //   //  const key2 = obj.initialValue[key];
  //     if (typeof key === 'object') {
  //       //generateArrays()
  //     }
  //     else {
  //       if (obj[key] instanceof Array) {
  //         //testingArr.push(obj[key]);
          
  //       }
  //       console.log(`${key}: ${value} `)
        
  //       // if (obj.initialValue) {
  //       //   if (key === 'initialValue' || key === 'text') {
  //       //   }
  //       //   //console.log(`${key}: ${obj[key]}`)
  //       // }
        
  //     }
  //   }
    
  // }
  // //console.log(testingArr);

  // generateArrays(getFields());

  // const reduceArray = (arr) => {
  //   for (let i = 0; i < arr.length; i++) {
  //     //console.log(arr[i]);
  //     if (Array.isArray(arr[i])) {
  //     //  arr.slice(i, 0);
  //     }
  //   }
  // }
  //console.log(currentValuesArr);

//  reduceArray(currentValuesArr);



  
  const findFieldValues = (object, key1: any, key2: any, arr: any) => {
    
    // const isObject = (typ: any) => {
      //     if (typ === null) {
        //       return false;
        //     }
        //     return (typeof typ === 'object');
        //   };

    //let val: any;
    // for (const val in getFields()) {
    //   console.log(getFields()[val]);
    // }
    // let val: any;
    //typeof (object[val]) === 'object'
    //console.log(`something`);

    for (let val in object) {
      const value = object[val];
      //console.log(value);
      
      // if (typeof (value) === 'object') {
      //   // arr.push(object[val]);
      //   //console.log(object);
      //   //console.log(value);
      //   // findFieldValues(value, key1, key2, arr);
      //   //break;
      // }
      if (val === key2) {
        console.log(`This is val: ${value}`)
        // if (!Array.isArray(value)) {
          //arr.push(value);
          //break;
          // }
        // findFieldValues(value, key1, key2, arr);
      }

        //console.log(value);
        //console.log(`console ${val2}`);
        //arr.push(val2);
    }

    // for (let i = 0; i < obj.length; i++) {
    //   if (typeof (obj) === 'object') {
    //     findFieldValues(obj[i], arr);
    //   }
    //   else {
    //     console.log(obj[i]);
    //   }
    // }
    // for (const [key, value] of Object.entries(getFields())) {
    //   console.log(`${key}: ${value}`);
    // }
  }

  
  // GENERATE STATE ARRAYS
  stateArrays(getFields(), 'initialValue', initialValuesArr);
  stateArrays(getFields(), 'value', currentValuesArr);
  



  
  // INITIAL STATE CHECKER
  // const initialStateChecker = (obj: Fields | Field)  => {
    
  //   var reRun = null;

  //   if (obj instanceof Array) {
  //     for (var i = 0; i < Object.keys(obj).length; i++) {
  //       reRun = initialStateChecker(obj[i]);
  //       if (reRun) {
  //         break;
  //       }
  //     }
  //   }
  //   else {
  //     for (var val in obj as Field) {
  //       if (obj[val] instanceof Array || obj[val] instanceof Object) {
  //         reRun = initialStateChecker(obj[val]);
  //         if (reRun) {
  //           break;
  //         };
  //       };

  //       if (obj.initialValue) {
  //         if (obj.initialValue !== undefined || obj.initialValue !== '') {
  //           initialValuesArr.push(obj.initialValue);
  //           break;
  //         }
  //       };
  //     };
  //   };
  //   return reRun;
  // }
  // initialStateChecker(getFields());

  // SHAPING CURRENT ARRAY

  //console.log(initialValuesArr.join(''));
  //console.log(initialValuesArr);
  //console.log(currentValuesArr);

  // JOIN-TRIM ARRAYS BEFORE COMPARING
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  console.log(initialValuesArrJoin);
  let currentValuesArrJoin = currentValuesArr.join("").trim();
  console.log(currentValuesArrJoin);
  
  if (initialValuesArrJoin === currentValuesArrJoin) {
    console.log(`state hasn't changed`)
    setModified(false)
    //canSave = modified;
  }
  else {
    console.log(`state has changed`)
    setModified(true)
    //canSave = !modified;
  }
  // //console.log(getFields())



  // end of testing 4





  // test 5


  // end of test 5






  //console.log(canSaveDraft);

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
      disabled={!modified}
    >
      {t('saveDraft')}
    </FormSubmit>
  );
};

export default SaveDraft;
