import payload from '..';

export const migrate = async (args: string[]): Promise<void> => {
  // Barebones instance to access database adapter
  await payload.init({
    secret: '--unused--',
    mongoURL: false,
    local: true,
  });

  const adapter = payload.config.db;

  if (!adapter) {
    throw new Error('No database adapter found');
  }

  switch (args[0]) {
    case 'migrate':
      await adapter.migrate(adapter);
      break;
    case 'migrate:status':
      await adapter.migrateStatus(adapter);
      break;
    case 'migrate:down':
      await adapter.migrateDown(adapter);
      break;
    case 'migrate:refresh':
      await adapter.migrateRefresh(adapter);
      break;
    case 'migrate:reset':
      await adapter.migrateReset(adapter);
      break;
    case 'migrate:fresh':
      await adapter.migrateFresh(adapter);
      break;
    case 'migrate:create':
      await adapter.createMigration(adapter, args[1]);
      break;

    default:
      throw new Error(`Unknown migration command: ${args[0]}`);
  }
};

// when launched directly
if (module.id === require.main.id) {
  const args = process.argv.slice(2);
  console.log({ args });
  migrate(args);
}
