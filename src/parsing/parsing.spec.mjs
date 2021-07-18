import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as parsing from './parsing.mjs';

const reduceScenariosSpec = suite('reduceScenariosSpec');
const reduceResponsesSpec = suite('reduceResponsesSpec');
const reducePathSpec = suite('reducePathSpec');

function assertReferenceHashesMatch({ refIndex, scenarios }) {
  assert.equal(
    Object.keys(refIndex),
    Object.keys(scenarios),
    'refIndex and scenarios reference hashes match',
  );
}

function assertContainsParameter(parameters = [], expected) {
  assert.ok(
    parameters.find(
      (parameter) =>
        parameter.name === expected.name &&
        parameter.in === expected.in &&
        parameter.required === expected.required &&
        parameter.description === expected.description,
    ),
    `parameters should contain a specific one called '${expected.name}'`,
  );
}

reduceScenariosSpec('reduces scenarios correctly', async () => {
  const actual = parsing.reduceScenariosSpec('/a/b/c', 'get', '200', [
    { name: 'scenario1' },
  ]);

  assert.equal(
    Object.keys(actual.refIndex).length,
    1,
    'there is one refIndex entry produced',
  );

  assert.equal(
    Object.keys(actual.scenarios).length,
    1,
    'there is one scenario produced',
  );

  assertReferenceHashesMatch(actual);

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'scenario1',
    ),
    'there is a scenaro called \'scenario1\'',
  );

  assert.ok(
    Object.values(actual.refIndex).find(
      (refIndexEntry) =>
        refIndexEntry.path === '/a/b/c' &&
        refIndexEntry.method === 'get' &&
        refIndexEntry.responseCode === '200' &&
        refIndexEntry.scenarioIndex === 0,
    ),
    'there is an expected refIndex entry',
  );
});

reduceResponsesSpec('reduces responses correctly', async () => {
  const responsesSpec = {
    200: {
      'description': 'success',
      'x-trest-scenarios': [
        { name: 'successScenario1' },
        { name: 'successScenario2' },
      ],
    },
    404: {
      'description': 'not found',
      'x-trest-scenarios': [{ name: 'notFoundScenario1' }],
    },
  };

  const actual = parsing.reduceResponsesSpec(
    '/a/b/c',
    'get',
    responsesSpec,
  );

  assert.equal(
    Object.keys(actual.refIndex).length,
    3,
    'there are three refIndex entry produced',
  );

  assert.equal(
    Object.keys(actual.scenarios).length,
    3,
    'there are three scenarios produced',
  );

  assertReferenceHashesMatch(actual);

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'successScenario1',
    ),
    'there is a scenario called \'successScenario1\'',
  );

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'successScenario2',
    ),
    'there is a scenario called \'successScenario2\'',
  );

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'notFoundScenario1',
    ),
    'there is a scenario called \'notFoundScenario1\'',
  );

  assert.equal(actual.responses, {
    200: { description: 'success' },
    404: { description: 'not found' },
  });
});

reducePathSpec('reduces path correctly', async () => {
  const pathSpec = {
    delete: {
      parameters: [
        {
          description: 'descriptionOfDeleteParameter1',
          in: 'header',
          name: 'deleteParameter1',
          required: true,
          schema: 'string',
        },
      ],
      responses: {
        204: {
          'description': 'deleted',
          'x-trest-scenarios': [{ name: 'deletedScenario1' }],
        },
      },
    },
    get: {
      parameters: [
        {
          description: 'descriptionOfGetParameter1',
          in: 'header',
          name: 'getParameter1',
          required: true,
          schema: 'string',
        },
      ],
      responses: {
        200: {
          'description': 'success',
          'x-trest-scenarios': [
            { name: 'successScenario1' },
            { name: 'successScenario2' },
          ],
        },
        404: {
          'description': 'not found',
          'x-trest-scenarios': [{ name: 'notFoundScenario1' }],
        },
      },
    },
    parameters: [
      {
        description: 'descriptionOfPathParameter1',
        in: 'header',
        name: 'pathParameter1',
        required: true,
        schema: 'string',
      },
      {
        description: 'descriptionOfPathParameter2',
        in: 'header',
        name: 'pathParameter2',
        required: true,
        schema: 'string',
      },
    ],
  };

  const actual = parsing.reducePathSpec('/a/b/c', pathSpec);

  assert.equal(
    Object.keys(actual.refIndex).length,
    4,
    'there are four refIndex entry produced',
  );

  assert.equal(
    Object.keys(actual.scenarios).length,
    4,
    'there are four scenarios produced',
  );

  assertReferenceHashesMatch(actual);

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'successScenario1',
    ),
    'there is a scenario called \'successScenario1\'',
  );

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'successScenario2',
    ),
    'there is a scenario called \'successScenario2\'',
  );

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'notFoundScenario1',
    ),
    'there is a scenario called \'notFoundScenario1\'',
  );

  assert.ok(
    Object.values(actual.scenarios).find(
      (scenario) => scenario.name === 'deletedScenario1',
    ),
    'there is a scenario called \'deletedScenario1\'',
  );

  assert.equal(actual.path.delete.responses, {
    204: { description: 'deleted' },
  });

  assert.equal(actual.path.get.responses, {
    200: {
      description: 'success',
    },
    404: {
      description: 'not found',
    },
  });

  assertContainsParameter(
    actual.path.delete.parameters,
    pathSpec.parameters[0],
  );
  assertContainsParameter(
    actual.path.delete.parameters,
    pathSpec.parameters[1],
  );
  assertContainsParameter(
    actual.path.delete.parameters,
    pathSpec.delete.parameters[0],
  );

  assertContainsParameter(
    actual.path.get.parameters,
    pathSpec.parameters[0],
  );
  assertContainsParameter(
    actual.path.get.parameters,
    pathSpec.parameters[1],
  );
  assertContainsParameter(
    actual.path.get.parameters,
    pathSpec.get.parameters[0],
  );
});

reduceScenariosSpec.run();
reduceResponsesSpec.run();
reducePathSpec.run();
