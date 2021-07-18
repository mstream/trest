import SwaggerParser from '@apidevtools/swagger-parser';
import { suite } from 'uvu';

import * as parsing from '../src/parsing/index.mjs';
import { assertIsEqualToSnapshot } from './asserting.mjs';
import * as snapshots from './snapshots/index.mjs';

const parseApi = suite('parseApi');

parseApi('parses correctly', async () => {
  const actual = parsing.parseApi(
    await SwaggerParser.validate('spec/fixtures/api.yml', {
      schema: true,
      spec: true,
    }),
  );

  assertIsEqualToSnapshot(actual, {
    api: snapshots.api,
    refIndex: snapshots.refIndex,
    scenarios: snapshots.scenarios,
  });
});

parseApi.run();
