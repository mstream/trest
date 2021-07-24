import * as fc from 'fast-check';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as generating from './index.mjs';

const generateContext = suite('generateContext');

const args = {
  api: {
    paths: {
      '/a/b/c': {
        get: {
          parameters: [
            {
              in: 'header',
              name: 'headerParameter1',
              schema: {
                type: 'string',
              },
            },
            {
              in: 'path',
              name: 'pathParameter1',
              schema: {
                type: 'string',
              },
            },
          ],
        },
      },
    },
  },
  scenarioRef: {
    method: 'get',
    path: '/a/b/c',
  },
  variables: {},
};

generateContext('same ref hashes generate same contexts', () => {
  fc.assert(
    fc.property(fc.string(), (scenarioRefHash1) => {
      const scenarioRefHash2 = scenarioRefHash1;

      const context1 = generating.generateContext({
        ...args,
        scenarioRefHash: scenarioRefHash1,
      });

      const context2 = generating.generateContext({
        ...args,
        scenarioRefHash: scenarioRefHash2,
      });

      assert.equal(context1, context2);
    }),
  );
});

generateContext(
  'different ref hashes generate different contexts',
  () => {
    fc.assert(
      fc.property(fc.string(), (scenarioRefHash1) => {
        const scenarioRefHash2 = `${scenarioRefHash1}_`;

        const context1 = generating.generateContext({
          ...args,
          scenarioRefHash: scenarioRefHash1,
        });

        const context2 = generating.generateContext({
          ...args,
          scenarioRefHash: scenarioRefHash2,
        });

        assert.not.equal(context1, context2);
      }),
    );
  },
);

generateContext.run();
