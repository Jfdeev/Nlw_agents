import { reset , seed  } from 'drizzle-seed'
import { db } from './connection.ts';
import { schema } from './schema/index.ts';

await reset(db, {schema});

await seed(db, {schema})