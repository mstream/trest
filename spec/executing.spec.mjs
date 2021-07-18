import cassandra from 'cassandra-driver';
import dockerCompose from 'docker-compose';
import path from 'path';
import * as R from 'ramda';
import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as executing from '../src/executing.mjs';
import * as snapshots from './snapshots/index.mjs';

const cassandraKeyspace = 'pcs';
const cassandraLocalDataCenter = 'datacenter1';

function createTable(keyspace, table, columns, primaryKey) {
  const primaryKeyDefinition = primaryKey.join(',');
  const columnDefinitions = Object.entries({
    ...columns,
    'PRIMARY KEY': `(${primaryKeyDefinition})`,
  })
    .map(([name, type]) => `${name} ${type}`)
    .join(',');

  return `CREATE TABLE IF NOT EXISTS ${keyspace}.${table} (${columnDefinitions})`;
}

const cqlQueries = {
  createKeyspace: (keyspace) =>
    `CREATE KEYSPACE IF NOT EXISTS ${keyspace} WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor' : 1}`,
  createTable,
  selectAll: (keyspace, table) =>
    `SELECT * FROM ${cassandraKeyspace}.${table}`,
  selectCurrentTime: () => 'SELECT now() FROM system.local',
};

const clients = {};

const variables = {};

const dockerComposeDownOpts = [['--timeout', 30]];

const dockerComposeOpts = {
  cwd: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'docker-compose',
  ),
  log: true,
};

async function createCassandraClient(contactPoint, localDataCenter) {
  const client = new cassandra.Client({
    contactPoints: [contactPoint],
    localDataCenter,
  });

  client.on('log', (level, loggerName, message) => {
    if (level === 'verbose' || level === 'info') {
      return;
    }
    console.info(
      `Test cassandra ${contactPoint}/${localDataCenter}`,
      `${level} - ${loggerName}: ${message}`,
    );
  });

  await client.execute(cqlQueries.selectCurrentTime());

  console.info(
    'Test Cassandra client created:',
    contactPoint,
    localDataCenter,
  );

  return client;
}

async function startContainers() {
  try {
    await dockerCompose.down({
      ...dockerComposeOpts,
      commandOptions: dockerComposeDownOpts,
    });
    await dockerCompose.upAll(dockerComposeOpts);

    let ready = false;

    while (!ready) {
      console.info('Waiting for Cassandra service to be ready...');
      // eslint-disable-next-line no-await-in-loop
      const { services } = (await dockerCompose.ps(dockerComposeOpts))
        .data;
      const cassandraService = services.find(
        (service) => service.name === 'cassandra',
      );

      if (cassandraService.state === 'Up (healthy)') {
        ready = true;
        const cqlNativePort = cassandraService.ports.find(
          (port) =>
            port.exposed &&
            port.exposed.port === 9042 &&
            port.exposed.protocol === 'tcp',
        ).mapped.port;
        const cassandraContactPoint = `localhost:${cqlNativePort}`;
        variables.cassandraContactPoint = cassandraContactPoint;
        variables.cassandraLocalDataCenter = cassandraLocalDataCenter;
        variables.cassandraKeyspace = cassandraKeyspace;

        // eslint-disable-next-line no-await-in-loop
        clients.cassandra = await createCassandraClient(
          cassandraContactPoint,
          cassandraLocalDataCenter,
        );
      }
    }
  } catch (error) {
    console.error('docker-compose up failure', error);
    throw error;
  }
}

async function stopContainers() {
  try {
    await clients.cassandra.shutdown();
    await dockerCompose.down({
      ...dockerComposeOpts,
      commandOptions: dockerComposeDownOpts,
    });
    console.info('docker-compose down succeeded');
  } catch (error) {
    console.error('docker-compose down failure', error);
    throw error;
  }
}

const execute = suite('execute');
execute.before(startContainers);
execute.after(stopContainers);

execute('executes correctly', async () => {
  const { api, mergedScenarios, refIndex } = snapshots;

  await clients.cassandra.execute(
    cqlQueries.createKeyspace(cassandraKeyspace),
  );

  await clients.cassandra.execute(
    cqlQueries.createTable(
      cassandraKeyspace,
      'ratings',
      {
        countryCode: 'text',
        values: 'text',
      },
      ['countryCode'],
    ),
  );

  const givenExecutionResult = await executing.execute({
    api,
    mergedScenarios,
    refIndex,
    variables,
  });

  const getAllRatingsResult = await clients.cassandra.execute(
    cqlQueries.selectAll(cassandraKeyspace, 'ratings'),
  );

  assert.equal(givenExecutionResult, snapshots.givenExecutionResult);

  assert.equal(getAllRatingsResult.rows.length, 1);

  assert.ok(
    getAllRatingsResult.rows[0].countrycode.length > 0,
    'there is country code set',
  );

  assert.equal(
    getAllRatingsResult.rows[0].values,
    R.path(
      [
        'mergedScenarios',
        'given',
        'cassandra',
        'present',
        0,
        'spec',
        'data',
        'values',
      ],
      snapshots,
    ),
  );
});

execute.run();
