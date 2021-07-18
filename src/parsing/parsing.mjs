import md5 from 'crypto-js/md5.js';
import R from 'ramda';

const methodNames = [
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
  'trace',
];

function hashScenarioRef({
  path,
  method,
  responseCode,
  scenarioIndex,
}) {
  return md5(`${path}|${method}|${responseCode}|${scenarioIndex}`);
}

export function reduceScenariosSpec(
  path,
  method,
  responseCode,
  scenariosSpec,
) {
  return scenariosSpec.reduce(
    (acc, scenarioSpec, scenarioIndex) => {
      const scenarioRef = {
        method,
        path,
        responseCode,
        scenarioIndex,
      };
      const scenarioRefHash = hashScenarioRef(scenarioRef);
      return {
        ...acc,
        refIndex: {
          ...acc.refIndex,
          [scenarioRefHash]: scenarioRef,
        },
        scenarios: {
          ...acc.scenarios,
          [scenarioRefHash]: scenarioSpec,
        },
      };
    },
    {
      refIndex: {},
      scenarios: {},
    },
  );
}

export function reduceResponsesSpec(path, method, responsesSpec) {
  return Object.entries(responsesSpec).reduce(
    (acc, [responseCode, responseCodeSpec]) => {
      const { refIndex, scenarios } = reduceScenariosSpec(
        path,
        method,
        responseCode,
        responseCodeSpec['x-trest-scenarios'] || [],
      );

      const {
        'x-trest-scenarios': _,
        ...responseCodeSpecWithoutScenarios
      } = responseCodeSpec;

      return {
        ...acc,
        refIndex: {
          ...acc.refIndex,
          ...refIndex,
        },
        responses: {
          ...acc.responses,
          [responseCode]: responseCodeSpecWithoutScenarios,
        },
        scenarios: {
          ...acc.scenarios,
          ...scenarios,
        },
      };
    },
    {
      refIndex: {},
      responses: {},
      scenarios: {},
    },
  );
}

export function reducePathSpec(path, pathSpec) {
  return Object.entries(R.pick(methodNames, pathSpec)).reduce(
    (acc, [method, methodSpec]) => {
      const { refIndex, responses, scenarios } = reduceResponsesSpec(
        path,
        method,
        methodSpec.responses,
      );

      return {
        ...acc,
        path: {
          ...acc.path,
          [method]: {
            ...acc.path[method],
            parameters: [
              ...(pathSpec.parameters || []),
              ...(acc.path[method].parameters || []),
            ],
            responses,
          },
        },
        refIndex: {
          ...acc.refIndex,
          ...refIndex,
        },
        scenarios: {
          ...acc.scenarios,
          ...scenarios,
        },
      };
    },
    {
      path: pathSpec,
      refIndex: {},
      scenarios: {},
    },
  );
}

function reducePathsSpec(pathsSpec) {
  return Object.entries(pathsSpec).reduce(
    (acc, [pathString, pathSpec]) => {
      const { refIndex, path, scenarios } = reducePathSpec(
        pathString,
        pathSpec,
      );

      return {
        ...acc,
        paths: {
          ...acc.paths,
          [pathString]: path,
        },
        refIndex: {
          ...acc.refIndex,
          ...refIndex,
        },
        scenarios: {
          ...acc.scenarios,
          ...scenarios,
        },
      };
    },
    {
      paths: {},
      refIndex: {},
      scenarios: {},
    },
  );
}

export function parseApi(api) {
  const { refIndex, paths, scenarios } = reducePathsSpec(api.paths);
  return {
    api: {
      ...api,
      paths,
    },
    refIndex,
    scenarios,
  };
}
