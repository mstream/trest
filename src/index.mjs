import SwaggerParser from '@apidevtools/swagger-parser';

import { execute } from './executing/index.mjs';
import { mergeScenarios } from './merging/index.mjs';
import { parseApi } from './parsing/index.mjs';

const apiPath = '../test/snapshots/api.yml';

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
