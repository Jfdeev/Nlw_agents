import { reset , seed  } from 'drizzle-seed'
import { db, sql } from './connection.ts';
import { schema } from './schema/index.ts';

await reset(db, {schema});

await seed(db, {schema})

await sql.end();

console.log('Database seeded successfully');