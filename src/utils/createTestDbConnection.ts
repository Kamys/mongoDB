import { Db, MongoClient } from 'mongodb';

type TestDbConnection = {
  db: Db;
  close: () => Promise<void>;
};

export const createTestDbConnection = async (): Promise<TestDbConnection> => {
  const mongodbUrl = (global as any).__MONGO_URI__;
  const mongodbName = (global as any).global.__MONGO_DB_NAME__;
  const connection = await MongoClient.connect(mongodbUrl, {
    useNewUrlParser: true,
  });
  const db = await connection.db(mongodbName);

  const close = async () => {
    await connection.close();
  };

  return { db, close };
};
