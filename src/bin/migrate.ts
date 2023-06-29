import payload from '..';

export const migrate = async (args: string[]): Promise<void> => {
  // Barebones instance to access database adapter
  await payload.init({
    secret: '--unused--',
    local: true,
  });

  const adapter = payload.config.db;

  if (!adapter) {
    throw new Error('No database adapter found');
  }

  switch (args[0]) {
    case 'migrate':
      await adapter.migrate();
      break;
    case 'migrate:status':
      await adapter.migrateStatus();
      break;
    case 'migrate:down':
      await adapter.migrateDown();
      break;
    case 'migrate:refresh':
      await adapter.migrateRefresh();
      break;
    case 'migrate:reset':
      await adapter.migrateReset();
      break;
    case 'migrate:fresh':
      await adapter.migrateFresh();
      break;
    case 'migrate:create':
      await adapter.createMigration(args[1]);
      break;

    default:
      throw new Error(`Unknown migration command: ${args[0]}`);
  }
};

// when launched directly
if (module.id === require.main.id) {
  const args = process.argv.slice(2);
  migrate(args).then(() => {
    process.exit(0);
  });
}
