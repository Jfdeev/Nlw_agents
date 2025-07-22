import { reset , seed  } from 'drizzle-seed'
import { db, sql } from './connection.ts';
import { schema } from './schema/index.ts';
import { rooms } from './schema/rooms.ts';
import { desc } from 'drizzle-orm';

await reset(db, schema);

await seed(db, schema).refine(f => {
    return {
        rooms: {
            count: 20,
            columns: {
                name: f.companyName(),
                description: f.loremIpsum()
            }
        }
    }
})

await sql.end();

console.log('Database seeded successfully');