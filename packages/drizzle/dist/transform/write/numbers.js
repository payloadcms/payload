export const transformNumbers = ({ baseRow, data, numbers })=>{
    data.forEach((val, i)=>{
        numbers.push({
            ...baseRow,
            number: val,
            order: i + 1
        });
    });
};

//# sourceMappingURL=numbers.js.map