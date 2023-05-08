import { Fields, Field } from "./types";

// function to generate arrays
const generateArray = (obj: Fields | Field, arr: any) => {
  for (const val in obj as Field) {
    if (obj[val] instanceof Array || obj[val] instanceof Object) {
      generateArray(obj[val], arr);
    } else {
      arr.push(obj[val]);
    }
  }
};

// function to compare states
export const compareStates = (
  initialObj: Fields | Field,
  currentObj: Fields | Field
) => {
  //arrays to store states values
  let initialValuesArr = [];
  let currentValuesArr = [];

  // generate arrays using the generate array function
  generateArray(initialObj, initialValuesArr);
  generateArray(currentObj, currentValuesArr);

  //console.log(initialValuesArr);
  //console.log(currentValuesArr);

  // reduce each array into a single string
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  //console.log(`initial: ${initialValuesArrJoin}`);
  let currentValuesArrJoin = currentValuesArr.join("").trim();
  //console.log(`current: ${currentValuesArrJoin}`);

  // compare the two strings - to be used to change the modified variable
  if (initialValuesArr.length !== 0) {
    if (initialValuesArrJoin === currentValuesArrJoin) {
      return false;
    } else {
      return true;
    }
  }
};

// function to disable the publish button when creating a new doc
export const publishButton = (
  initialObj: Fields | Field,
  currentObj: Fields | Field
) => {
  // --- comment: this block is similar to the block in the previous function, I will find a way to simplify this.
  //arrays to store states values
  let initialValuesArr = [];
  let currentValuesArr = [];

  // function to generate arrays
  generateArray(initialObj, initialValuesArr);
  generateArray(currentObj, currentValuesArr);

  // reduce each array into a single string
  let initialValuesArrJoin = initialValuesArr.join("").trim();
  let currentValuesArrJoin = currentValuesArr.join("").trim();
  // --- end of comment

  // compare the two strings
  if (initialValuesArrJoin === "draft" && currentValuesArrJoin === "draft") {
    // console.log(`empty doc - can't publish`)
    return false;
  }
};

// function to compare states
export const compareStateArrs = (initialArr: string, currentArr: string) => {
  // compare the two strings - to be used to change the modified variable
  if (initialArr !== null) {
    if (initialArr === currentArr) {
      return false;
    } else {
      return true;
    }
  }
};
