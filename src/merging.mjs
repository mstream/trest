function mergeGivenCassandraModule(scenarios) {
  return Object.entries(scenarios).reduce(
    (acc, [scenarioRefHash, scenario]) => ({
      ...acc,
      present: [
        ...acc.present,
        ...(scenario?.given?.cassandra?.present || []).map((spec) => ({
          scenarioRefHash,
          spec,
        })),
      ],
    }),
    { present: [] },
  );
}

function mergeThenCassandraModule(scenarios) {
  return Object.entries(scenarios).reduce(
    (acc, [scenarioRefHash, scenario]) => ({
      ...acc,
      absent: [
        ...acc.absent,
        ...(scenario?.then?.cassandra?.absent || []).map((spec) => ({
          scenarioRefHash,
          spec,
        })),
      ],
      present: [
        ...acc.present,
        ...(scenario?.then?.cassandra?.present || []).map((spec) => ({
          scenarioRefHash,
          spec,
        })),
      ],
    }),
    { absent: [], present: [] },
  );
}

const moduleMergers = {
  given: {
    cassandra: mergeGivenCassandraModule,
  },
  then: {
    cassandra: mergeThenCassandraModule,
  },
};

export function mergeScenarios(scenarios) {
  const given = Object.entries(moduleMergers.given).reduce(
    (acc, [moduleName, mergeModule]) => ({
      ...acc,
      [moduleName]: mergeModule(scenarios),
    }),
    {},
  );
  const then = Object.entries(moduleMergers.then).reduce(
    (acc, [moduleName, mergeModule]) => ({
      ...acc,
      [moduleName]: mergeModule(scenarios),
    }),
    {},
  );
  return { given, then };
}
