import SwaggerParser from '@apidevtools/swagger-parser';
import { suite } from 'uvu';

import { assertIsEqualToSnapshot } from '../../test/asserting.mjs';
import * as snapshots from '../../test/snapshots/index.mjs';
import * as parsing from './index.mjs';

const parseApi = suite('parseApi');

parseApi('parses correctly', async () => {
  const actual = parsing.parseApi(
    await SwaggerParser.validate('test/snapshots/api.yml', {
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
