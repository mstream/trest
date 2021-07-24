import axios from 'axios';

import { evaluateRequest } from '../evaluating/index.mjs';
import { generateContext } from '../generating/index.mjs';
import * as cassandraModule from './cassandra.mjs';
import * as responseModule from './response.mjs';

const moduleExecutors = {
  given: {
    cassandra: cassandraModule.executeGiven,
  },
  then: {
    cassandra: cassandraModule.executeThen,
    response: responseModule.execute,
  },
};

async function executeHttpRequest({
  api,
  scenarioRef,
  scenarioRefHash,
}) {
  const context = generateContext({
    api,
    scenarioRef,
    scenarioRefHash,
    variables: {},
  });

  const request = evaluateRequest({
    pathTemplate: scenarioRef.path,
    requestParameters: context.request,
  });

  return Promise.all(
    api.servers.map((server) =>
      axios({
        headers: request.headers,
        method: scenarioRef.method,
        url: `${server.url}${request.path}`,
        validateStatus: (status) => status >= 100 && status <= 599,
      }),
    ),
  );
}

async function executeHttpRequests({ api, refIndex }) {
  const executionPromises = Object.entries(refIndex).map(
    ([scenarioRefHash, scenarioRef]) =>
      executeHttpRequest({
        api,
        scenarioRef,
        scenarioRefHash,
      }).then((responses) =>
        responses.reduce(
          (acc, response) => ({
            ...acc,
            [scenarioRefHash]: response,
          }),
          {},
        ),
      ),
  );

  return Promise.all(executionPromises).then((result) =>
    result.reduce(
      (acc, responses) => ({
        ...acc,
        ...responses,
      }),
      {},
    ),
  );
}

async function executeGiven({ api, given, refIndex, variables }) {
  const executionPromises = Object.entries(moduleExecutors.given).map(
    ([moduleName, executeModule]) =>
      executeModule({
        api,
        module: given[moduleName],
        refIndex,
        variables,
      }),
  );

  await Promise.all(executionPromises);
}

async function executeThen({
  api,
  refIndex,
  responses,
  then,
  variables,
}) {
  const executionPromises = Object.entries(moduleExecutors.then).map(
    ([moduleName, executeModule]) =>
      executeModule({
        api,
        module: then[moduleName],
        refIndex,
        responses,
        variables,
      }).then((result) => ({
        moduleName,
        result,
      })),
  );

  return Promise.all(executionPromises);
}

export async function execute({
  api,
  mergedScenarios,
  refIndex,
  variables,
}) {
  try {
    await executeGiven({
      api,
      given: mergedScenarios.given,
      refIndex,
      variables,
    });

    const responses = await executeHttpRequests({
      api,
      refIndex,
    });

    const assertionResults = await executeThen({
      api,
      refIndex,
      responses,
      then: mergedScenarios.then,
      variables,
    });

    console.log(JSON.stringify(assertionResults));
  } catch (error) {
    console.error('Test execution failure:', error);
    throw error;
  }

  return {
    failedTests: [],
    passedTests: [],
  };
}
