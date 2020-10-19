import { Collection, Db } from 'mongodb';
import { createTestDbConnection } from './createTestDbConnection';

type ActCallback<T extends object> = (
  collection: Collection<T>,
) => Promise<T[]>;

export const createTestDbRunner = () => {
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

  return () => ({
    init: <T extends object>(entities: T[]) => ({
      act: (cb: ActCallback<T>) => ({
        expect: async (expectValue: any): Promise<void> => {
          const collection = db.collection('entities');
          await collection.insertMany(entities);
          const result = await cb(collection);
          expect(result).toEqual(expectValue);
        },
      }),
    }),
  });
};
