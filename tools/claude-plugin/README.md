# Payload Skill for Claude Code

Claude Code skill providing comprehensive guidance for Payload development with TypeScript patterns, field configurations, hooks, access control, and API examples.

## Installation

### From GitHub

Install this skill directly from the Payload repository:

```bash
/plugin install github:payloadcms/payload
```

## What's Included

The `payload` skill provides expert guidance on:

- **Collections**: Auth, uploads, drafts, live preview configurations
- **Fields**: All field types including relationships, arrays, blocks, joins, virtual fields
- **Hooks**: beforeChange, afterChange, beforeValidate, field hooks
- **Access Control**: Collection, field, and global access patterns including RBAC and multi-tenant
- **Queries**: Local API, REST, and GraphQL with complex operators
- **Database Adapters**: MongoDB, Postgres, SQLite configurations and transactions
- **Advanced Features**: Jobs queue, custom endpoints, localization, plugins

## Usage

Once installed, Claude will automatically invoke the skill when you're working on Payload CMS projects. The skill activates when you:

- Edit `payload.config.ts` files
- Work with collection or global configurations
- Ask about Payload-specific patterns
- Need guidance on fields, hooks, or access control

You can also explicitly invoke it:

```
@payload how do I implement row-level access control?
```

## Documentation Structure

```
skills/payload/
├── SKILL.md                              # Main skill file with quick reference
└── reference/
    ├── FIELDS.md                         # All field types and configurations
    ├── COLLECTIONS.md                    # Collection patterns
    ├── HOOKS.md                          # Hook patterns and examples
    ├── ACCESS-CONTROL.md                 # Basic access control
    ├── ACCESS-CONTROL-ADVANCED.md        # Advanced access patterns
    ├── QUERIES.md                        # Query patterns and APIs
    ├── ADAPTERS.md                       # Database and storage adapters
    └── ADVANCED.md                       # Jobs, endpoints, localization
```

## Resources

- [Payload Documentation](https://payloadcms.com/docs)
- [GitHub Repository](https://github.com/payloadcms/payload)
- [Examples](https://github.com/payloadcms/payload/tree/main/examples)
- [Templates](https://github.com/payloadcms/payload/tree/main/templates)

## License

MIT
