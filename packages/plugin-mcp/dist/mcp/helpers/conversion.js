export const toCamelCase = (str)=>{
    return str.replace(/-([a-z])/g, (match, letter)=>letter.toUpperCase());
};

//# sourceMappingURL=conversion.js.map