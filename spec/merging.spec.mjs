import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as merging from '../src/merging.mjs';
import * as snapshots from './snapshots/index.mjs';

const mergeScenarios = suite('mergeScenarios');

mergeScenarios('merges correctly', () =>
  assert.equal(
    snapshots.mergedScenarios,
    merging.mergeScenarios(snapshots.scenarios),
  ),
);

mergeScenarios.run();
