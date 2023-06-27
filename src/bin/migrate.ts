import payload from '..';
import loadConfig from '../config/load';

export const migrate = async (args: string[]): Promise<void> => {
  const config = await loadConfig();

  // Barebones instance to access database adapter
  await payload.init({
    secret: '--unused--',
    mongoURL: false,
    local: true,
  });

  const adapter = config.db;

  if (!adapter) {
    throw new Error('No database adapter found');
  }

  switch (args[0]) {
    case 'migrate:migrate':
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
      await adapter.createMigration(adapter);
      break;

    default:
      throw new Error(`Unknown migration command: ${args[0]}`);
  }
};
