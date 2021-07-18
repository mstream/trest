import md5 from 'crypto-js/md5.js';

function evaluateExt(name, variables) {
  const value = variables[name];
  if (value == null) {
    throw new Error(`Could not find external variable called ${name}`);
  }
  return value;
}

function evaluateReq(jsonPath, request) {
  const go = (segments, value) => {
    if (value == null) {
      throw new Error(
        `JSON path '${jsonPath}' does not reference any request value`,
      );
    }
    if (segments.length === 0) {
      return value;
    }
    return go(segments.slice(1), value[segments[0]]);
  };
  return go(jsonPath.split('.').slice(1), request);
}

function evaluateUniq(alias, scenarioRefHash) {
  return `${md5(`${scenarioRefHash}|${alias}`)}`;
}

function evaluateString(string, context) {
  const found = string.match(/^{{\s*(\S+)\s*\|\s*(EXT|REQ|UNIQ)\s*}}$/);
  if (found) {
    const [exporession, evaluatorName] = found.slice(1);
    switch (evaluatorName) {
      case 'EXT':
        return evaluateExt(exporession, context.variables);

      case 'REQ':
        return evaluateReq(exporession, context.request);

      case 'UNIQ':
        return evaluateUniq(exporession, context.scenarioRefHash);

      default:
        throw new Error(`Unsupported evaluator '${evaluatorName}'`);
    }
  }
  return string;
}

export function evaluateValue(value, context) {
  if (typeof value === 'string') {
    return evaluateString(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((v) => evaluateValue(v, context));
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce(
      (acc, [propertyName, propertyValue]) => ({
        ...acc,
        [propertyName]: evaluateValue(propertyValue, context),
      }),
      {},
    );
  }

  return value;
}
