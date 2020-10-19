import { createTestDbConnection } from '../utils';
import { Collection, Db } from 'mongodb';

const createUser = async (users: Collection) => {
  await users.insertOne({ name: 'Nikiata', age: 21, skill: 'JavaScript' });
  await users.insertOne({ name: 'Vasa', age: 25, skill: 'Java' });
  await users.insertOne({ name: 'Ura', age: 23, skill: 'C#' });
  await users.insertOne({ name: 'Pavel', age: 26, skill: 'JavaScript' });
};

describe('find', () => {
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

  it('in', async () => {
    const users = db.collection('users');

    await createUser(users);

    const result = await users.find({ skill: { $in: ['Java', 'JavaScript'] } });

    expect(await result.toArray()).toEqual(
      expect.objectContaining([
        {
          _id: expect.any(Object),
          age: 21,
          name: 'Nikiata',
          skill: 'JavaScript',
        },
        {
          _id: expect.any(Object),
          age: 25,
          name: 'Vasa',
          skill: 'Java',
        },
        {
          _id: expect.any(Object),
          age: 26,
          name: 'Pavel',
          skill: 'JavaScript',
        },
      ]),
    );
  });

  it('or', async () => {
    const users = db.collection('users');

    await createUser(users);

    const result = await users.find({
      $or: [{ age: { $lt: 22 } }, { age: 26 }],
    });

    expect(await result.toArray()).toEqual(
      expect.objectContaining([
        {
          _id: expect.any(Object),
          age: 21,
          name: 'Nikiata',
          skill: 'JavaScript',
        },
      ]),
    );
  });

  describe('array', () => {
    const createUserWithSkills = async (users: Collection) => {
      await users.insertOne({
        name: 'Vasa',
        skills: ['NodeJs', 'Ruby', 'React', 'Git'],
      });
      await users.insertOne({
        name: 'Gena',
        skills: ['React', 'JavaScript', 'CSS', 'Git'],
      });
      await users.insertOne({
        name: 'Nikita',
        skills: ['Docker', 'C#', 'CSS', 'Git'],
      });
      await users.insertOne({
        name: 'Pavel',
        skills: ['HTML', 'CSS', 'NodeJs'],
      });
      await users.insertOne({
        name: 'Alexandra',
        skills: ['NodeJs', 'CSS'],
      });
      await users.insertOne({
        name: 'Anastasia',
        skills: ['Docker'],
      });
    };

    it('find who can NodeJs and CSS', async () => {
      const users = db.collection('users');

      await createUserWithSkills(users);

      const result = await users
        .find({ skills: { $all: ['NodeJs', 'CSS'] } })
        .toArray();

      expect(result).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Pavel',
            skills: ['HTML', 'CSS', 'NodeJs'],
          },
          {
            _id: expect.any(Object),
            name: 'Alexandra',
            skills: ['NodeJs', 'CSS'],
          },
        ]),
      );
    });

    it('find who can only Docker', async () => {
      const users = db.collection('users');

      await createUserWithSkills(users);

      const result = await users.find({ skills: ['Docker'] }).toArray();

      expect(result).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Anastasia',
            skills: ['Docker'],
          },
        ]),
      );
    });
  });

  describe('document nested', () => {
    const createUserWithSkills = async (users: Collection) => {
      await users.insertOne({
        name: 'Vasa',
        skill: { name: 'Java', experienceYear: 3 },
        doneProjects: [
          {
            name: 'Project 1',
          },
          {
            name: 'Project 2',
          },
        ],
      });
    };

    it('document nested have matter', async () => {
      const users = db.collection('users');

      await createUserWithSkills(users);

      const result = await users
        .find({ skill: { name: 'Java', experienceYear: 3 } })
        .toArray();

      expect(result).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Vasa',
            skill: { name: 'Java', experienceYear: 3 },
            doneProjects: [
              {
                name: 'Project 1',
              },
              {
                name: 'Project 2',
              },
            ],
          },
        ]),
      );

      const resultSecond = await users
        .find({ skill: { experienceYear: 3, name: 'Java' } })
        .toArray();

      expect(resultSecond).toEqual(expect.objectContaining([]));
    });

    it('document nested not have matter', async () => {
      const users = db.collection('users');

      await createUserWithSkills(users);

      const resultSecond = await users
        .find({ 'skill.experienceYear': 3, 'skill.name': 'Java' })
        .toArray();

      expect(resultSecond).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Vasa',
            skill: { name: 'Java', experienceYear: 3 },
            doneProjects: [
              {
                name: 'Project 1',
              },
              {
                name: 'Project 2',
              },
            ],
          },
        ]),
      );
    });

    it('use $elemMatch for found element in array', async () => {
      const users = db.collection('users');

      await users.insertOne({
        name: 'Vasa',
        skills: [
          { name: 'Java', experienceYear: 3 },
          { name: 'С#', experienceYear: 1 },
        ],
      });
      await users.insertOne({
        name: 'Anna',
        skills: [
          { name: 'JavaScript', experienceYear: 3 },
          { name: 'С#', experienceYear: 1 },
        ],
      });

      const resultSecond = await users
        .find({ skills: { $elemMatch: { experienceYear: 3, name: 'Java' } } })
        .toArray();

      expect(resultSecond).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Vasa',
            skills: [
              { name: 'Java', experienceYear: 3 },
              { name: 'С#', experienceYear: 1 },
            ],
          },
        ]),
      );
    });

    it('you can use . (dot) in query condition for nesting value', async () => {
      const users = db.collection('users');

      await createUserWithSkills(users);

      const result = await users.find({ 'skill.name': 'Java' }).toArray();

      expect(result).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Vasa',
            skill: { name: 'Java', experienceYear: 3 },
            doneProjects: [
              {
                name: 'Project 1',
              },
              {
                name: 'Project 2',
              },
            ],
          },
        ]),
      );
    });

    it('you can use . (dot) in query condition for nesting array', async () => {
      const users = db.collection('users');

      await createUserWithSkills(users);

      const result = await users
        .find({ 'doneProjects.0.name': 'Project 1' })
        .toArray();

      expect(result).toEqual(
        expect.objectContaining([
          {
            _id: expect.any(Object),
            name: 'Vasa',
            skill: { name: 'Java', experienceYear: 3 },
            doneProjects: [
              {
                name: 'Project 1',
              },
              {
                name: 'Project 2',
              },
            ],
          },
        ]),
      );
    });
  });

  describe('to configure which fields are returned', () => {
    it('do not return id', async () => {
      const users = db.collection('users');

      await users.insertOne({
        name: 'Alex',
        age: 28,
        work: { company: 'Apple', jobPosition: 'Swift developer' },
      });

      const result = await users
        .find({ name: 'Alex' })
        .project({ name: 1, _id: 0, 'work.jobPosition': 1 })
        .toArray();

      expect(result).toEqual([
        {
          name: 'Alex',
          work: {
            jobPosition: 'Swift developer',
          },
        },
      ]);
    });

    it('do not return same field', async () => {
      const users = db.collection('users');

      await users.insertOne({
        name: 'Alex',
        age: 28,
        work: { company: 'Apple', jobPosition: 'Swift developer' },
      });

      const result = await users
        .find({ name: 'Alex' })
        .project({ _id: 0, 'work.company': 0 })
        .toArray();

      expect(result).toEqual([
        {
          name: 'Alex',
          age: 28,
          work: {
            jobPosition: 'Swift developer',
          },
        },
      ]);
    });

    it('$slice return last element ', async () => {
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
        .project({ _id: 0, city: 1, jobs: { $slice: -1 } })
        .toArray();

      expect(result).toEqual([
        {
          city: 'Moscow',
          jobs: [{ company: 'Microsoft', jobPosition: 'С# developer' }],
        },
        {
          city: 'Petersburg',
          jobs: [{ company: 'IBM', jobPosition: 'Project manager' }],
        },
      ]);
    });
  });

  describe('query for Null or Missing Fields', () => {
    it('get all when field not exist ro null', async () => {
      const inventory = db.collection('inventory');

      await inventory.insertMany([
        { _id: 1, item: null },
        { _id: 2 },
        { _id: 3, item: 'Value' },
      ]);

      const result = await inventory.find({ item: null }).toArray();

      expect(result).toEqual([
        {
          _id: 1,
          item: null,
        },
        {
          _id: 2,
        },
      ]);
    });

    it('get all when field is null', async () => {
      const inventory = db.collection('inventory');

      await inventory.insertMany([
        { _id: 1, item: null },
        { _id: 2 },
        { _id: 3, item: 'Value' },
      ]);

      // 10 is number of type in  BSON Type (See https://docs.mongodb.com/manual/reference/bson-types/)
      const result = await inventory.find({ item: { $type: 10 } }).toArray();

      expect(result).toEqual([
        {
          _id: 1,
          item: null,
        },
      ]);
    });

    it('get all when field not exist', async () => {
      const inventory = db.collection('inventory');

      await inventory.insertMany([
        { _id: 1, item: null },
        { _id: 2 },
        { _id: 3, item: 'Value' },
      ]);

      const result = await inventory
        .find({ item: { $exists: false } })
        .toArray();

      expect(result).toEqual([{ _id: 2 }]);
    });
  });
});
