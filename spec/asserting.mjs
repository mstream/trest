import isCircular from '@ipld/is-circular';
import R from 'ramda';
import * as assert from 'uvu/assert';

function isRecord(value) {
  return typeof value === 'object' && !Array.isArray(value);
}

function getObjectPropertyKeys(object) {
  return Object.entries(object).reduce(
    (acc, [key, value]) => (isRecord(value) ? [...acc, key] : acc),
    [],
  );
}

function pathToString(path) {
  return path.length === 0 ? '.' : path.join('.');
}

function handleError(originalActual, originalSnapshot, path, error) {
  const assertionErrorName = 'AssertionError';
  if (error.name === 'Assertion' || error.name === assertionErrorName) {
    throw error;
  } else {
    const pathString = pathToString(path);
    const actualParentString = JSON.stringify(
      R.path(path.slice(0, -1), originalActual),
    );
    const snapshotParentString = JSON.stringify(
      R.path(path.slice(0, -1), originalSnapshot),
    );
    const errorSummary = `Error during assertion of snapshot path: ${pathString}`;
    const errorDescription = `Reason:\n${error.message}\n${error.stack}`;
    const actualValueParentDescription = `Original actual value parent:\n${actualParentString}`;
    const snapshotValueParentDescription = `Original snapshot value parent:\n${snapshotParentString}`;
    const assertionError = new Error(
      [
        errorSummary,
        errorDescription,
        actualValueParentDescription,
        snapshotValueParentDescription,
      ].join('\n---\n'),
    );

    assertionError.name = assertionErrorName;

    throw assertionError;
  }
}

function assertNotCircular(actual, snapshot) {
  if (isCircular(snapshot)) {
    throw new Error('snapshot contains circular depencencies');
  }
  if (isCircular(actual)) {
    throw new Error('actual value contains circular depencencies');
  }
}

export function assertIsEqualToSnapshot(
  actual,
  snapshot,
  path = [],
  originalActual = null,
  originalSnapshot = null,
) {
  const effectiveOriginalActual = originalActual || actual;
  const effectiveOriginalSnapshot = originalSnapshot || snapshot;
  try {
    const pathString = pathToString(path);
    if (isRecord(snapshot) && isRecord(actual)) {
      assertNotCircular(actual, snapshot);
      const objectPropertyKeys = [
        ...getObjectPropertyKeys(snapshot),
        ...getObjectPropertyKeys(actual),
      ].reduce(
        (acc, key) => (acc.includes(key) ? acc : [...acc, key]),
        [],
      );

      if (objectPropertyKeys.length === 0) {
        assert.equal(actual, snapshot, pathString);
      } else {
        objectPropertyKeys.forEach((key) =>
          assertIsEqualToSnapshot(
            actual[key],
            snapshot[key],
            [...path, key],
            effectiveOriginalActual,
            effectiveOriginalSnapshot,
          ),
        );
      }
    } else {
      assert.equal(actual, snapshot, pathString);
    }
  } catch (error) {
    handleError(
      effectiveOriginalActual,
      effectiveOriginalSnapshot,
      path,
      error,
    );
  }
}
