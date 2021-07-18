import SwaggerParser from '@apidevtools/swagger-parser';

import { execute } from './executing.mjs';
import { mergeScenarios } from './merging.mjs';
import { parseApi } from './parsing/index.mjs';

const apiPath = 'spec/fixtures/api.yml';

async function run() {
  const { api, refIndex, scenarios } = await parseApi(
    await SwaggerParser.dereference(apiPath),
  );

  const mergedScenarios = await mergeScenarios(scenarios);

  await execute({
    api,
    mergedScenarios,
    refIndex,
    variables: {},
  });
}

run()
  .then(() => null)
  .catch((error) => {
    throw error;
  });
