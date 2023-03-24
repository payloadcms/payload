import { Fields, Field } from "./types";
import { generateArray } from "./generateArray";

// function to compare states
export const stateHasChanged = (obj: Fields | Field) => {

// --- comment: I wanted to create the two arrays somewhere and use them in the two functions within this file, but because I'm using useWatchForm hook it throws and error 'invalid hook call' and I haven't yet figured this out. So, I'm creating the arrays inside each exported function
  //arrays to store states values
  let initialValuesArr = [];
  let currentValuesArr = [];
  
  // generate arrays using the generate array function
  generateArray(obj, 'initialValue', initialValuesArr);
  generateArray(obj, 'value', currentValuesArr);
  
  // reduce each array into a single string
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  let currentValuesArrJoin = currentValuesArr.join("").trim();
// --- end of comment

  // compare the two strings - to be used to change the modified variable
  if (initialValuesArrJoin === currentValuesArrJoin) {
    // console.log(`state hasn't changed`)
    return false;
  }
  else  {
    // console.log(`state has changed`)
    return true;
  }
};


// function to disable the publish button when creating a new doc
export const publishButton = (obj: Fields | Field) => {

// --- comment: this block is similar to the block in the previous function, I will find a way to simplify this.
  //arrays to store states values
  let initialValuesArr = [];
  let currentValuesArr = [];

  // function to generate arrays
  generateArray(obj, 'initialValue', initialValuesArr);
  generateArray(obj, 'value', currentValuesArr);

  // reduce each array into a single string
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  let currentValuesArrJoin = currentValuesArr.join("").trim();
// --- end of comment

  // compare the two strings
  if (initialValuesArrJoin === 'draft' && currentValuesArrJoin === 'draft') {
    // console.log(`empty doc - can't publish`)
    return false;
  }
};

// code by eustachio