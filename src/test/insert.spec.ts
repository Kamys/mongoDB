import { createTestDbConnection } from '../utils/createTestDbConnection';
import { Collection, Db } from 'mongodb';

describe('insert', () => {
  let db: Db;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    const testConnection = await createTestDbConnection();

    db = testConnection.db;
    closeDb = testConnection.close;
  });

  afterAll(async (done) => {
    closeDb && (await closeDb());
    done();
  });

  afterEach(async () => {
    await db.dropDatabase();
  });

  it('insert many', async () => {
    const users = db.collection('users');

    await users.insertMany([
      { name: 'Nikiata', age: 21, skill: 'JavaScript' },
      { name: 'Vasa', age: 25, skill: 'Java' },
      { name: 'Ura', age: 23, skill: 'C#' },
      { name: 'Pavel', age: 26, skill: 'JavaScript' },
    ]);

    const user = await users.findOne({ name: 'Nikiata' });
  });
});
