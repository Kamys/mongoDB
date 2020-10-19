import { createTestDbRunner } from '../utils/createTestDbRunner';

describe('find', () => {
  const runTest = createTestDbRunner();

  it('in', async () => {
    await runTest()
      .init([
        { skill: 'JavaScript' },
        { skill: 'Java' },
        { skill: 'C#' },
        { skill: 'JavaScript' },
      ])
      .act((collection) =>
        collection
          .find({ skill: { $in: ['Java', 'JavaScript'] } })
          .project({ _id: 0 })
          .toArray(),
      )
      .expect(
        expect.objectContaining([
          { skill: 'JavaScript' },
          { skill: 'Java' },
          { skill: 'JavaScript' },
        ]),
      );
  });

  describe('or', () => {
    it('return by first condition', async () => {
      await runTest()
        .init([{ age: 21 }, { age: 25 }, { age: 23 }, { age: 26 }])
        .act((collection) =>
          collection
            .find({
              $or: [{ age: { $lt: 22 } }, { age: 26 }],
            })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect(expect.objectContaining([{ age: 21 }]));
    });

    it('return by second condition, if not found item by first condition', async () => {
      await runTest()
        .init([{ age: 21 }, { age: 25 }, { age: 23 }, { age: 26 }])
        .act((collection) =>
          collection
            .find({
              $or: [{ age: { $lt: 20 } }, { age: 26 }],
            })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect(expect.objectContaining([{ age: 26 }]));
    });
  });

  describe('array', () => {
    const entities = [
      {
        name: 'Vasa',
        skills: ['NodeJs', 'Ruby', 'React', 'Git'],
      },
      {
        name: 'Gena',
        skills: ['React', 'JavaScript', 'CSS', 'Git'],
      },
      {
        name: 'Nikita',
        skills: ['Docker', 'C#', 'CSS', 'Git'],
      },
      {
        name: 'Pavel',
        skills: ['HTML', 'CSS', 'NodeJs'],
      },
      {
        name: 'Alexandra',
        skills: ['NodeJs', 'CSS'],
      },
      {
        name: 'Anastasia',
        skills: ['Docker'],
      },
    ];
    it('find who can NodeJs and CSS', async () => {
      await runTest()
        .init(entities)
        .act((collection) =>
          collection
            .find({ skills: { $all: ['NodeJs', 'CSS'] } })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect([
          {
            name: 'Pavel',
            skills: ['HTML', 'CSS', 'NodeJs'],
          },
          {
            name: 'Alexandra',
            skills: ['NodeJs', 'CSS'],
          },
        ]);
    });

    it('find who can only Docker', async () => {
      await runTest()
        .init(entities)
        .act((collection) =>
          collection
            .find({ skills: ['Docker'] })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect([
          {
            name: 'Anastasia',
            skills: ['Docker'],
          },
        ]);
    });
  });

  describe('document nested', () => {
    const entities = [
      {
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
    ];

    describe('document nested have matter', () => {
      it('find successful', async () => {
        await runTest()
          .init(entities)
          .act((collection) =>
            collection
              .find({ skill: { name: 'Java', experienceYear: 3 } })
              .project({ _id: 0 })
              .toArray(),
          )
          .expect([
            {
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
          ]);
      });

      it('find return empty array, because nested have matter', async () => {
        await runTest()
          .init(entities)
          .act((collection) =>
            collection
              .find({ skill: { experienceYear: 3, name: 'Java' } })
              .project({ _id: 0 })
              .toArray(),
          )
          .expect([]);
      });
    });

    it('document nested not have matter', async () => {
      await runTest()
        .init(entities)
        .act((collection) =>
          collection
            .find({ 'skill.experienceYear': 3, 'skill.name': 'Java' })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect([
          {
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
        ]);
    });

    const userWithSkill = [
      {
        name: 'Vasa',
        skills: [
          { name: 'Java', experienceYear: 3 },
          { name: 'С#', experienceYear: 1 },
        ],
      },
      {
        name: 'Anna',
        skills: [
          { name: 'JavaScript', experienceYear: 3 },
          { name: 'С#', experienceYear: 1 },
        ],
      },
    ];

    it('use $elemMatch for found element in array', async () => {
      await runTest()
        .init(userWithSkill)
        .act((collection) =>
          collection
            .find({
              skills: { $elemMatch: { experienceYear: 3, name: 'Java' } },
            })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect([
          {
            name: 'Vasa',
            skills: [
              { name: 'Java', experienceYear: 3 },
              { name: 'С#', experienceYear: 1 },
            ],
          },
        ]);
    });

    it('you can use . (dot) in query condition for nesting value', async () => {
      await runTest()
        .init(entities)
        .act((collection) =>
          collection
            .find({ 'skill.name': 'Java' })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect([
          {
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
        ]);
    });

    it('you can use . (dot) in query condition for nesting array', async () => {
      await runTest()
        .init(entities)
        .act((collection) =>
          collection
            .find({ 'doneProjects.0.name': 'Project 1' })
            .project({ _id: 0 })
            .toArray(),
        )
        .expect([
          {
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
        ]);
    });
  });

  /*
describe('to configure which fields are returned', () => {
it('do not return id', async () => {
  const users = db.collection('users');
  await users.insertOne({
    name: 'Alex',
    age: 28,
    work: { company: 'Apple', jobPosition: 'Swift developer' },
  });

  // ACT
  const result = await users
    .find({ name: 'Alex' })
    .project({ name: 1, _id: 0, 'work.jobPosition': 1 })
    .toArray();

  // ASSERT
  const expectValue = {
    name: 'Alex',
    work: {
      jobPosition: 'Swift developer',
    },
  };
  expect(result[0]).toEqual(expectValue);
});

it('do not return same field', async () => {
  const users = db.collection('users');
  await users.insertOne({
    name: 'Alex',
    age: 28,
    work: { company: 'Apple', jobPosition: 'Swift developer' },
  });

  // ACT
  const result = await users
    .find({ name: 'Alex' })
    .project({ _id: 0, 'work.company': 0 })
    .toArray();

  // ASSERT
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
        { company: 'IBM', jobPosition: 'Manager' },
        { company: 'Apple', jobPosition: 'Swift developer' },
        { company: 'Microsoft', jobPosition: 'С# developer' },
        { company: 'Apple', jobPosition: 'Designer' },
        { company: 'IBM', jobPosition: 'Designer' },
        { company: 'Apple', jobPosition: 'Java developer' },
      ],
    },
    {
      city: 'Petersburg',
      jobs: [
        { company: 'IBM', jobPosition: 'С++ developer' },
        { company: 'Apple', jobPosition: 'Swift developer' },
        { company: 'IBM', jobPosition: 'Project manager' },
        { company: 'Apple', jobPosition: 'JavaScript developer' },
      ],
    },
  ]);

  // ACT
  const result = await users
    .find({})
    .project({ _id: 0, city: 1, jobs: { $slice: -1 } })
    .toArray();

  // ASSERT
  const expectValue = [
    {
      city: 'Moscow',
      jobs: [
        {
          company: 'Apple',
          jobPosition: 'Java developer',
        },
      ],
    },
    {
      city: 'Petersburg',
      jobs: [
        {
          company: 'Apple',
          jobPosition: 'JavaScript developer',
        },
      ],
    },
  ];
  expect(result).toEqual(expectValue);
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

  // ACT
  const result = await inventory.find({ item: null }).toArray();

  // ASSERT
  const expectValue = [{ _id: 1, item: null }, { _id: 2 }];
  expect(result).toEqual(expectValue);
});

it('get all when field is null', async () => {
  const inventory = db.collection('inventory');
  await inventory.insertMany([
    { _id: 1, item: null },
    { _id: 2 },
    { _id: 3, item: 'Value' },
  ]);
  // 10 is number of type in  BSON Type (See https://docs.mongodb.com/manual/reference/bson-types/)
  const BSON_NULL_TYPE_NUMBER = 10;

  // ACT
  const result = await inventory
    .find({ item: { $type: BSON_NULL_TYPE_NUMBER } })
    .toArray();

  // ASSERT
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

  // ACT
  const result = await inventory
    .find({ item: { $exists: false } })
    .toArray();

  // ASSERT
  expect(result).toEqual([{ _id: 2 }]);
});
});*/
});
