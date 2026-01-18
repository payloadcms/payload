export function keyValuePairToHtmlTable(obj) {
    let htmlTable = '<table>';
    for (const [key, value] of Object.entries(obj)){
        htmlTable += `<tr><td>${key}</td><td>${value}</td></tr>`;
    }
    htmlTable += '</table>';
    return htmlTable;
}

//# sourceMappingURL=keyValuePairToHtmlTable.js.map