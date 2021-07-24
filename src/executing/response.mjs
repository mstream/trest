import { evaluateValue } from '../evaluating/index.mjs';
import { generateContext } from '../generating/index.mjs';

export async function execute({
  api,
  module,
  refIndex,
  responses,
  variables,
}) {
  return module.statusCode.reduce((acc, { scenarioRefHash, spec }) => {
    const context = generateContext({
      api,
      scenarioRef: refIndex[scenarioRefHash],
      scenarioRefHash,
      variables,
    });

    const expectedStatusCode = evaluateValue(spec, context);

    const actualStatusCode = responses[scenarioRefHash]?.status;

    return {
      ...acc,
      [scenarioRefHash]: {
        actualStatusCode,
        expectedStatusCode,
      },
    };
  });
}
