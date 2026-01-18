import { convertLexicalNodesToHTML } from '../serializeLexical.js';
export const ParagraphHTMLConverter = {
    async converter ({ converters, node, parent, submissionData }) {
        const childrenText = await convertLexicalNodesToHTML({
            converters,
            lexicalNodes: node.children,
            parent: {
                ...node,
                parent
            },
            submissionData
        });
        return `<p>${childrenText}</p>`;
    },
    nodeTypes: [
        'paragraph'
    ]
};

//# sourceMappingURL=paragraph.js.map