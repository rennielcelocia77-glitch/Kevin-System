import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { checkDatabase } from './src/config/db.js';

try {
  await checkDatabase();
  app.listen(env.port, env.host, () => console.log(`Broom Business API listening on ${env.host}:${env.port}`));
} catch (error) {
  console.error('Unable to connect to MySQL:', error.message);
  process.exit(1);
}
