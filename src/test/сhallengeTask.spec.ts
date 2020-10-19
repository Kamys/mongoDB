import { createTestDbConnection } from '../utils/createTestDbConnection';
import { Collection, Db } from 'mongodb';

describe('challenge', () => {
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

  it('filter nested array', async () => {
    const users = db.collection('users');

    await users.insertMany([
      {
        city: 'Moscow',
        jobs: [
          { company: 'Apple', jobPosition: 'Swift developer' },
          { company: 'Apple', jobPosition: 'Designer' },
          { company: 'Apple', jobPosition: 'Java developer' },
          { company: 'IBM', jobPosition: 'Manager' },
          { company: 'IBM', jobPosition: 'Designer' },
          { company: 'Microsoft', jobPosition: 'С# developer' },
        ],
      },
      {
        city: 'Petersburg',
        jobs: [
          { company: 'Apple', jobPosition: 'Swift developer' },
          { company: 'Apple', jobPosition: 'JavaScript developer' },
          { company: 'IBM', jobPosition: 'С++ developer' },
          { company: 'IBM', jobPosition: 'Project manager' },
        ],
      },
    ]);

    const result = await users
      .find({})
      .project({ _id: 0, city: 1, jobs: { $elemMatch: { company: 'IBM' } } })
      .toArray();

    expect(result).toEqual([
      {
        city: 'Moscow',
        jobs: [{ company: 'IBM', jobPosition: 'Manager' }],
      },
      {
        city: 'Petersburg',
        jobs: [
          { company: 'IBM', jobPosition: 'С++ developer' },
          { company: 'IBM', jobPosition: 'Project manager' },
        ],
      },
    ]);
  });
});
