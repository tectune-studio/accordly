import { Client, loadConfig, connectConfig } from './common.mjs';
loadConfig();
const client = new Client(connectConfig(process.env.ACCORDLY_MAINTENANCE_DATABASE_URL));
try {
  await client.connect();
  console.log(
    (await client.query('select accordly.process_retention($1) as result', [1000])).rows[0].result,
  );
} catch (e) {
  console.error('Retention job failed:', e.code || '', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
