import { parse } from '@swc/core';
import chalk from 'chalk';
import { parseModule, Syntax } from 'esprima-next';
import fs from 'fs';
import { log, warning } from '../utils/log.js';
export const withPayloadStatement = {
    cjs: `const { withPayload } = require("@payloadcms/next/withPayload");`,
    esm: `import { withPayload } from "@payloadcms/next/withPayload";`,
    ts: `import { withPayload } from "@payloadcms/next/withPayload";`
};
export const wrapNextConfig = async (args)=>{
    const { nextConfigPath, nextConfigType: configType } = args;
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');
    const { modifiedConfigContent: newConfig, success } = await parseAndModifyConfigContent(configContent, configType);
    if (!success) {
        return;
    }
    fs.writeFileSync(nextConfigPath, newConfig);
};
/**
 * Parses config content with AST and wraps it with withPayload function
 */ export async function parseAndModifyConfigContent(content, configType) {
    content = withPayloadStatement[configType] + '\n' + content;
    if (configType === 'cjs' || configType === 'esm') {
        try {
            const ast = parseModule(content, {
                loc: true
            });
            if (configType === 'cjs') {
                // Find `module.exports = X`
                const moduleExports = ast.body.find((p)=>p.type === Syntax.ExpressionStatement && p.expression?.type === Syntax.AssignmentExpression && p.expression.left?.type === Syntax.MemberExpression && p.expression.left.object?.type === Syntax.Identifier && p.expression.left.object.name === 'module' && p.expression.left.property?.type === Syntax.Identifier && p.expression.left.property.name === 'exports');
                if (moduleExports && moduleExports.expression.right?.loc) {
                    const modifiedConfigContent = insertBeforeAndAfter(content, moduleExports.expression.right.loc);
                    return {
                        modifiedConfigContent,
                        success: true
                    };
                }
                return Promise.resolve({
                    modifiedConfigContent: content,
                    success: false
                });
            } else if (configType === 'esm') {
                const exportDefaultDeclaration = ast.body.find((p)=>p.type === Syntax.ExportDefaultDeclaration);
                const exportNamedDeclaration = ast.body.find((p)=>p.type === Syntax.ExportNamedDeclaration);
                if (!exportDefaultDeclaration && !exportNamedDeclaration) {
                    throw new Error('Could not find ExportDefaultDeclaration in next.config.js');
                }
                if (exportDefaultDeclaration && exportDefaultDeclaration.declaration?.loc) {
                    const modifiedConfigContent = insertBeforeAndAfter(content, exportDefaultDeclaration.declaration.loc);
                    return {
                        modifiedConfigContent,
                        success: true
                    };
                } else if (exportNamedDeclaration) {
                    const exportSpecifier = exportNamedDeclaration.specifiers.find((s)=>s.type === 'ExportSpecifier' && s.exported?.name === 'default' && s.local?.type === 'Identifier' && s.local?.name);
                    if (exportSpecifier) {
                        warning('Could not automatically wrap next.config.js with withPayload.');
                        warning('Automatic wrapping of named exports as default not supported yet.');
                        warnUserWrapNotSuccessful(configType);
                        return {
                            modifiedConfigContent: content,
                            success: false
                        };
                    }
                }
                warning('Could not automatically wrap Next config with withPayload.');
                warnUserWrapNotSuccessful(configType);
                return Promise.resolve({
                    modifiedConfigContent: content,
                    success: false
                });
            }
        } catch (error) {
            if (error instanceof Error) {
                warning(`Unable to parse Next config. Error: ${error.message} `);
                warnUserWrapNotSuccessful(configType);
            }
            return {
                modifiedConfigContent: content,
                success: false
            };
        }
    } else if (configType === 'ts') {
        const { moduleItems, parseOffset } = await compileTypeScriptFileToAST(content);
        const exportDefaultDeclaration = moduleItems.find((m)=>m.type === 'ExportDefaultExpression' && (m.expression.type === 'Identifier' || m.expression.type === 'CallExpression'));
        if (exportDefaultDeclaration) {
            if (!('span' in exportDefaultDeclaration.expression)) {
                warning('Could not automatically wrap Next config with withPayload.');
                warnUserWrapNotSuccessful(configType);
                return Promise.resolve({
                    modifiedConfigContent: content,
                    success: false
                });
            }
            const modifiedConfigContent = insertBeforeAndAfterSWC(content, exportDefaultDeclaration.expression.span, parseOffset);
            return {
                modifiedConfigContent,
                success: true
            };
        }
    }
    warning('Could not automatically wrap Next config with withPayload.');
    warnUserWrapNotSuccessful(configType);
    return Promise.resolve({
        modifiedConfigContent: content,
        success: false
    });
}
function warnUserWrapNotSuccessful(configType) {
    // Output directions for user to update next.config.js
    const withPayloadMessage = `

  ${chalk.bold(`Please manually wrap your existing Next config with the withPayload function. Here is an example:`)}

  ${withPayloadStatement[configType]}

  const nextConfig = {
    // Your Next.js config here
  }

  ${configType === 'cjs' ? 'module.exports = withPayload(nextConfig)' : 'export default withPayload(nextConfig)'}

`;
    log(withPayloadMessage);
}
function insertBeforeAndAfter(content, loc) {
    const { end, start } = loc;
    const lines = content.split('\n');
    const insert = (line, column, text)=>{
        return line.slice(0, column) + text + line.slice(column);
    };
    // insert ) after end
    lines[end.line - 1] = insert(lines[end.line - 1], end.column, ')');
    // insert withPayload before start
    if (start.line === end.line) {
        lines[end.line - 1] = insert(lines[end.line - 1], start.column, 'withPayload(');
    } else {
        lines[start.line - 1] = insert(lines[start.line - 1], start.column, 'withPayload(');
    }
    return lines.join('\n');
}
function insertBeforeAndAfterSWC(content, span, /**
   * WARNING: This is ONLY for unit tests. Defaults to 0 otherwise.
   *
   * @see compileTypeScriptFileToAST
   */ parseOffset) {
    const { end: preOffsetEnd, start: preOffsetStart } = span;
    const start = preOffsetStart - parseOffset;
    const end = preOffsetEnd - parseOffset;
    const insert = (pos, text)=>{
        return content.slice(0, pos) + text + content.slice(pos);
    };
    // insert ) after end
    content = insert(end - 1, ')');
    // insert withPayload before start
    content = insert(start - 1, 'withPayload(');
    return content;
}
/**
 * Compile typescript to AST using the swc compiler
 */ async function compileTypeScriptFileToAST(fileContent) {
    let parseOffset = 0;
    /**
   * WARNING: This is ONLY for unit tests.
   *
   * Multiple instances of swc DO NOT reset the .span.end value.
   * During unit tests, the .spawn.end value is read and accounted for.
   *
   * https://github.com/swc-project/swc/issues/1366
   */ if (process.env.NODE_ENV === 'test') {
        parseOffset = (await parse('')).span.end;
    }
    const module = await parse(fileContent, {
        syntax: 'typescript'
    });
    return {
        moduleItems: module.body,
        parseOffset
    };
}

//# sourceMappingURL=wrap-next-config.js.map