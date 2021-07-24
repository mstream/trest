import cassandra from 'cassandra-driver';
import md5 from 'crypto-js/md5.js';

import { evaluateValue } from '../evaluating/index.mjs';
import { generateContext } from '../generating/index.mjs';

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

const clients = {};

function hashCassandraClientId({ contactPoint, localDataCenter }) {
  return `${md5(`${contactPoint}|${localDataCenter}`)}`;
}

async function createCassandraClient(contactPoint, localDataCenter) {
  const cassandraClientIdHash = hashCassandraClientId({
    contactPoint,
    localDataCenter,
  });

  const client = clients[cassandraClientIdHash]
    ? clients[cassandraClientIdHash]
    : new cassandra.Client({
        contactPoints: [contactPoint],
        localDataCenter,
      });

  clients[cassandraClientIdHash] = client;

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

async function shutDownCassandraClients() {
  const shutdownCassandraClientPromises = Object.values(clients).map(
    (client) => client.shutdown(),
  );
  try {
    await Promise.all(shutdownCassandraClientPromises);
    console.info('Trest Cassandra clients shut down');
  } catch (error) {
    console.error('Could not shut down Trest cassandra clients', error);
    throw error;
  }
}

export async function executeGiven({
  api,
  module,
  refIndex,
  variables,
}) {
  const executionPromises = module.present.map(
    ({ scenarioRefHash, spec }) => {
      const context = generateContext({
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

  await shutDownCassandraClients();

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

export async function executeThen({
  api,
  module,
  refIndex,
  variables,
}) {
  // TODO implement
  console.log({ api, module, refIndex, variables });

  return {};
}
