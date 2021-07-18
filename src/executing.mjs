import cassandra from 'cassandra-driver';
import md5 from 'crypto-js/md5.js';
import jsf from 'json-schema-faker';
import R from 'ramda';

import { evaluateValue } from './evaluating.mjs';

function insert(keyspace, table, data) {
  const columnNames = Object.keys(data).join(',');
  const values = Object.values(data)
    .map((value) => `'${value}'`)
    .join(',');
  return `INSERT INTO ${keyspace}.${table} (${columnNames}) VALUES (${values})`;
}

const cqlQueries = {
  insert,
  selectAll: (keyspace, table) => `SELECT * FROM ${keyspace}.${table}`,
  selectCurrentTime: () => 'SELECT now() FROM system.local',
};

const clients = {
  cassandra: {},
};

const requests = {};

function hashCassandraClientId({ contactPoint, localDataCenter }) {
  return `${md5(`${contactPoint}|${localDataCenter}`)}`;
}

async function createCassandraClient(contactPoint, localDataCenter) {
  const cassandraClientIdHash = hashCassandraClientId({
    contactPoint,
    localDataCenter,
  });

  const client = clients.cassandra[cassandraClientIdHash]
    ? clients.cassandra[cassandraClientIdHash]
    : new cassandra.Client({
        contactPoints: [contactPoint],
        localDataCenter,
      });

  clients.cassandra[cassandraClientIdHash] = client;

  client.on('log', (level, loggerName, message) => {
    if (level === 'verbose' || level === 'info') {
      return;
    }
    console.info(
      `Trest cassandra ${contactPoint}/${localDataCenter}`,
      `${level} - ${loggerName}: ${message}`,
    );
  });

  await client.execute(cqlQueries.selectCurrentTime());

  console.info(
    'Trest Cassandra client created:',
    contactPoint,
    localDataCenter,
  );

  return client;
}

function generateRequest({ operation, scenarioRefHash }) {
  const parameters = operation.parameters || [];

  // TODO make deterministic based on the hash
  console.log(scenarioRefHash);

  const headerParameters = parameters.filter(
    (parameter) => parameter.in === 'header',
  );
  const pathParameters = parameters.filter(
    (parameter) => parameter.in === 'path',
  );

  const headers = headerParameters.reduce(
    (acc, parameter) => ({
      ...acc,
      [parameter.name]: jsf.generate(parameter.schema),
    }),
    {},
  );

  const path = pathParameters.reduce(
    (acc, parameter) => ({
      ...acc,
      [parameter.name]: jsf.generate(parameter.schema),
    }),
    {},
  );

  return { headers, path };
}

function genereteContext({
  api,
  scenarioRef,
  scenarioRefHash,
  variables,
}) {
  const operation = R.path(
    ['paths', scenarioRef.path, scenarioRef.method],
    api,
  );

  if (operation == null) {
    throw new Error(
      `Missing opearation specification '${scenarioRef.method} ${scenarioRef.path}'`,
    );
  }

  const request = requests[scenarioRefHash]
    ? requests[scenarioRefHash]
    : generateRequest({ operation, scenarioRefHash });

  requests[scenarioRefHash] = request;

  return {
    request,
    scenarioRefHash,
    variables,
  };
}

async function executeGivenCassandraModule({
  api,
  module,
  refIndex,
  variables,
}) {
  const executionPromises = module.present.map(
    ({ scenarioRefHash, spec }) => {
      const context = genereteContext({
        api,
        scenarioRef: refIndex[scenarioRefHash],
        scenarioRefHash,
        variables,
      });

      const { contactPoint, keyspace, localDataCenter, data, table } =
        evaluateValue(spec, context);

      return createCassandraClient(contactPoint, localDataCenter).then(
        (cassandraClient) =>
          cassandraClient.execute(
            cqlQueries.insert(keyspace, table, data),
          ),
      );
    },
  );

  const results = await Promise.all(
    executionPromises.map((promise) => promise.catch((error) => error)),
  );

  const errors = results.filter((result) => result instanceof Error);

  if (errors.length > 0) {
    throw new Error(
      `Cassandra errors: ${JSON.stringify(
        errors.map((error) => error.message),
      )}`,
    );
  }

  return {};
}

const moduleExecutors = {
  given: {
    cassandra: executeGivenCassandraModule,
  },
};
async function executeGiven({
  api,
  context,
  given,
  refIndex,
  variables,
}) {
  const executionPromises = Object.entries(moduleExecutors.given).map(
    ([moduleName, executeModule]) =>
      executeModule({
        api,
        context,
        module: given[moduleName],
        refIndex,
        variables,
      }),
  );

  await Promise.all(executionPromises);
}

async function executeThen({ api, context, refIndex, then }) {
  // TODO implement
  console.log(api, context, refIndex, then);
  await Promise.all([]);
}

async function shutDownCassandraClients() {
  const shutdownCassandraClientPromises = Object.values(
    clients.cassandra,
  ).map((client) => client.shutdown());
  try {
    await Promise.all(shutdownCassandraClientPromises);
    console.info('Trest Cassandra clients shut down');
  } catch (error) {
    console.error('Could not shut down Trest cassandra clients', error);
    throw error;
  }
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

    await executeThen({
      api,
      refIndex,
      then: mergedScenarios.then,
      variables,
    });
  } catch (error) {
    console.error('Test execution failure:', error);
    throw error;
  } finally {
    await shutDownCassandraClients();
  }

  return {};
}
