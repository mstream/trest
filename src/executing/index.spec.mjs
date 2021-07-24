import axios from 'axios';
import cassandra from 'cassandra-driver';
import dockerCompose from 'docker-compose';
import * as R from 'ramda';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as snapshots from '../../test/snapshots/index.mjs';
import * as executing from './index.mjs';

const cassandraKeyspace = 'pcs';
const cassandraLocalDataCenter = 'datacenter1';
const wiremockBaseUrl = 'http://localhost:8080';

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

const wiremockQueries = {
  findRequestsByCriteria: async (criteria) =>
    axios({
      data: criteria,
      method: 'post',
      responseType: 'json',
      url: `${wiremockBaseUrl}/__admin/requests/find`,
    }).then((response) => response.data),
};

const clients = {};

const variables = {};

const dockerComposeDownOpts = [['--timeout', 30]];

const dockerComposeOpts = {
  cwd: 'test/docker-compose',
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
      console.info(
        'Waiting for Cassandra and Wiremock services to be ready...',
      );
      // eslint-disable-next-line no-await-in-loop
      const { services } = (await dockerCompose.ps(dockerComposeOpts))
        .data;

      const cassandraService = services.find(
        (service) => service.name === 'cassandra',
      );

      const wiremockService = services.find(
        (service) => service.name === 'wiremock',
      );

      const upStatus = 'Up (healthy)';

      if (
        cassandraService.state === upStatus &&
        wiremockService.state === upStatus
      ) {
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

  const executionResult = await executing.execute({
    api: snapshots.api,
    mergedScenarios: snapshots.mergedScenarios,
    refIndex: snapshots.refIndex,
    variables,
  });

  const getAllRatingsResult = await clients.cassandra.execute(
    cqlQueries.selectAll(cassandraKeyspace, 'ratings'),
  );

  assert.equal(
    executionResult,
    snapshots.executionResult,
    'execution result',
  );

  assert.equal(
    getAllRatingsResult.rows.length,
    1,
    'cassandra rows number',
  );

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

  const { requests } = await wiremockQueries.findRequestsByCriteria({
    method: 'ANY',
    urlPattern: '.*',
  });

  assert.equal(
    requests.length,
    Object.keys(snapshots.refIndex).length,
    'sends one HTTP request per scenario',
  );
});

execute.run();
