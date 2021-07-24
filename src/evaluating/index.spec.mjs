import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import * as evaluating from './index.mjs';

const evaluateValue = suite('evaluateRequest');
const evaluateRequest = suite('evaluateValue');

function externalExpressions(names) {
  return names.reduce(
    (acc, name) => ({
      ...acc,
      expressions: {
        ...acc.expressions,
        [name]: `{{ ${name} | EXT }}`,
      },
      variables: {
        ...acc.variables,
        [name]: `${name}Value`,
      },
    }),
    {
      expressions: {},
      variables: {},
    },
  );
}

evaluateRequest('builds a request based on provided context', () => {
  const pathTemplate = '/a/{pathParam1}/b/{pathParam2}/c';
  const requestParameters = {
    headers: {
      headerParam1: 'headerParamValue1',
      headerParam2: 'headerParamValue2',
    },
    path: {
      pathParam1: 'pathParamValue1',
      pathParam2: 'pathParamValue2',
    },
  };

  assert.equal(
    evaluating.evaluateRequest({ pathTemplate, requestParameters }),
    {
      headers: requestParameters.headers,
      path: '/a/pathParamValue1/b/pathParamValue2/c',
    },
  );
});

evaluateValue('evaluates a regular string', () => {
  assert.equal(evaluating.evaluateValue('abc'), 'abc');
});

evaluateValue('evaluates a regular number', () => {
  assert.equal(evaluating.evaluateValue(1), 1);
});

evaluateValue('evaluates an external string', () => {
  const { expressions, variables } = externalExpressions(['ext1']);

  assert.equal(
    evaluating.evaluateValue(expressions.ext1, { variables }),
    variables.ext1,
  );
});

evaluateValue('evaluates a request value', () => {
  assert.equal(
    evaluating.evaluateValue('{{ .foo.bar | REQ }}', {
      request: { foo: { bar: 'baz' } },
    }),
    'baz',
  );
});

evaluateValue('evaluates an unique value', () => {
  assert.equal(
    evaluating.evaluateValue('{{ foo | UNIQ }}', {
      scenarioRefHash: 'd01468c87c6f33af2ead1533758a3640',
    }),
    '064312893a976d73585673c560bbc618',
  );
});

evaluateValue('evaluates an array', () => {
  const { expressions, variables } = externalExpressions([
    'ext1',
    'ext2',
  ]);

  assert.equal(
    evaluating.evaluateValue([expressions.ext1, expressions.ext2], {
      variables,
    }),
    [variables.ext1, variables.ext2],
  );
});

evaluateValue('evaluates an object', () => {
  const { expressions, variables } = externalExpressions([
    'ext1',
    'ext2',
    'ext3',
    'ext4',
  ]);

  assert.equal(
    evaluating.evaluateValue(
      {
        a: expressions.ext1,
        b: { d: expressions.ext2 },
        c: [expressions.ext3, expressions.ext4],
      },
      {
        variables,
      },
    ),
    {
      a: variables.ext1,
      b: { d: variables.ext2 },
      c: [variables.ext3, variables.ext4],
    },
  );
});

evaluateRequest.run();
evaluateValue.run();
