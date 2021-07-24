import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as snapshots from '../../test/snapshots/index.mjs';
import * as merging from './index.mjs';

const mergeScenarios = suite('mergeScenarios');

mergeScenarios('merges correctly', () =>
  assert.equal(
    snapshots.mergedScenarios,
    merging.mergeScenarios(snapshots.scenarios),
  ),
);

mergeScenarios.run();
