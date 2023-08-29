export const migrationTemplate = `
import payload, { Payload } from 'payload';

export async function up(payload: Payload): Promise<void> {
  // Migration code
};

export async function down(payload: Payload): Promise<void> {
  // Migration code
};
`;
