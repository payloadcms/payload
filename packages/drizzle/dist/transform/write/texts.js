export const transformTexts = ({ baseRow, data, texts })=>{
    data.forEach((val, i)=>{
        texts.push({
            ...baseRow,
            order: i + 1,
            text: val
        });
    });
};

//# sourceMappingURL=texts.js.map