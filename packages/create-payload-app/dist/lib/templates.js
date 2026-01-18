import { error, info } from '../utils/log.js';
export function validateTemplate({ templateName }) {
    const validTemplates = getValidTemplates();
    if (!validTemplates.map((t)=>t.name).includes(templateName)) {
        error(`'${templateName}' is not a valid template.`);
        info(`Valid templates: ${validTemplates.map((t)=>t.name).join(', ')}`);
        return false;
    }
    return true;
}
export function getValidTemplates() {
    // Starters _must_ be a valid template name from the templates/ directory
    return [
        {
            name: 'blank',
            type: 'starter',
            description: 'Blank 3.0 Template',
            url: `https://github.com/payloadcms/payload/templates/blank#main`
        },
        {
            name: 'website',
            type: 'starter',
            description: 'Website Template',
            url: `https://github.com/payloadcms/payload/templates/website#main`
        },
        {
            name: 'ecommerce',
            type: 'starter',
            description: 'Ecommerce template',
            url: 'https://github.com/payloadcms/payload/templates/ecommerce#main'
        },
        {
            name: 'with-cloudflare-d1',
            type: 'starter',
            dbType: 'd1-sqlite',
            description: 'Blank template with Cloudflare D1 and Workers integration',
            url: 'https://github.com/payloadcms/payload/templates/with-cloudflare-d1#main'
        },
        {
            name: 'plugin',
            type: 'plugin',
            description: 'Template for creating a Payload plugin',
            url: 'https://github.com/payloadcms/payload/templates/plugin#main'
        }
    ];
}

//# sourceMappingURL=templates.js.map