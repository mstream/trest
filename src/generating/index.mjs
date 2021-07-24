import sha512 from 'crypto-js/sha512.js';
import R from 'ramda';

function generateString({ index, scenarioRefHash, type }) {
  return sha512(`${scenarioRefHash}|${type}|${index}`).toString();
}

function generateParameter({ index, scenarioRefHash, schema, type }) {
  switch (schema.type) {
    case 'string':
      return generateString({
        index,
        scenarioRefHash,
        type,
      });

    case 'number':
      // TODO implement
      return 0;

    case 'integer':
      // TODO implement
      return 0;

    default:
      throw new Error(`Unsupported schema type: '${schema.type}'`);
  }
}

function generateParameters({
  parameters,
  scenarioRefHash,
  parameterType,
}) {
  return parameters.reduce(
    (acc, parameter, index) => ({
      ...acc,
      [parameter.name]: generateParameter({
        index,
        scenarioRefHash,
        schema: parameter.schema,
        type: parameterType,
      }),
    }),
    {},
  );
}

function generateRequest({ operation, scenarioRefHash }) {
  const parameters = operation.parameters || [];

  const headerParameters = parameters.filter(
    (parameter) => parameter.in === 'header',
  );
  const pathParameters = parameters.filter(
    (parameter) => parameter.in === 'path',
  );

  const headers = generateParameters({
    parameterType: 'path',
    parameters: headerParameters,
    scenarioRefHash,
  });

  const path = generateParameters({
    parameterType: 'header',
    parameters: pathParameters,
    scenarioRefHash,
  });

  return { headers, path };
}

export function generateContext({
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

  return {
    request: generateRequest({ operation, scenarioRefHash }),
    variables,
  };
}
