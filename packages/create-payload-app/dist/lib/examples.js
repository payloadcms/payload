import { error, info } from '../utils/log.js';
export async function getExamples({ branch }) {
    const url = `https://api.github.com/repos/payloadcms/payload/contents/examples?ref=${branch}`;
    const response = await fetch(url);
    const examplesResponseList = await response.json();
    const examples = examplesResponseList.map((example)=>({
            name: example.name,
            url: `https://github.com/payloadcms/payload/examples/${example.name}#${branch}`
        }));
    return examples;
}
export async function parseExample({ name, branch }) {
    const examples = await getExamples({
        branch
    });
    const example = examples.find((e)=>e.name === name);
    if (!example) {
        error(`'${name}' is not a valid example name.`);
        info(`Valid examples: ${examples.map((e)=>e.name).join(', ')}`);
        return false;
    }
    return example;
}

//# sourceMappingURL=examples.js.map