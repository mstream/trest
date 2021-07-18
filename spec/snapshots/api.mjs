const exampleRefs = {
  inputValidationErrorResponseBody: 'InputValidationErrorResponseBody',
  securityFailureResponseBody: 'SecurityFailureResponseBody',
  userTokenMissingResponseBody: 'UserTokenMissingResponseBody',
};

const parameterRefs = {
  countryCodePathParameter: 'CountryCodePathParameter',
  requestIdHeader: 'RequestIdHeader',
};

const responseRefs = {
  forbiddenError: 'ForbiddenError',
  invalidInputError: 'InvalidInputError',
  notFoundError: 'NotFoundError',
  unauthorizedError: 'UnauthorizedError',
  unexpectedError: 'UnexpectedError',
};

const schemaRefs = {
  checkResult: 'CheckResult',
  checkResults: 'CheckResults',
  countryCode: 'CountryCode',
  countryCodes: 'CountryCodes',
  rating: 'Rating',
  ratings: 'Ratings',
  serviceInfo: 'ServiceInfo',
  validationError: 'ValidationError',
  validationErrors: 'ValidationErrors',
};

const inputValidationError = {
  description: 'Invalid <name of the value> supplied\n',
  errorCode: 'OVP_00027',
};

const missingUserTokenError = {
  description: 'Missing mandatory data: X-SkyOTT-UserToken\n',
  errorCode: 'OVP_00001',
};

const securityFailureError = {
  description: 'Security failure\n',
  errorCode: 'OVP_00306',
};

const checkResultSchema = {
  additionalProperties: true,
  properties: { isHealthy: { type: 'boolean' } },
  required: ['isHealthy'],
  type: 'object',
};

const examples = {
  [exampleRefs.inputValidationErrorResponseBody]: {
    summary: 'Input validation error',
    value: [inputValidationError],
  },
  [exampleRefs.securityFailureResponseBody]: {
    summary: 'Generic security failure',
    value: [securityFailureError],
  },
  [exampleRefs.userTokenMissingResponseBody]: {
    summary: 'User token not provided',
    value: [missingUserTokenError],
  },
};

const parameters = {
  [parameterRefs.countryCodePathParameter]: {
    description: 'CountryCode\n',
    in: 'path',
    name: 'countryCode',
    required: true,
    schema: { example: 'GB', minLength: 2, type: 'string' },
  },
  [parameterRefs.requestIdHeader]: {
    description:
      'Request tracking identifier which is used to correlate subsequent downstream requests with each other.\n',
    example: 'cfcb46e7-cc41-4610-9824-7c532a9a6557',
    in: 'header',
    name: 'X-SkyOTT-RequestId',
    required: false,
    schema: { type: 'string' },
  },
};

const schemas = {
  [schemaRefs.checkResult]: checkResultSchema,
  [schemaRefs.checkResults]: {
    additionalProperties: checkResultSchema,
    type: 'object',
  },
  [schemaRefs.countryCode]: {
    example: 'GB',
    minLength: 2,
    type: 'string',
  },
  [schemaRefs.countryCodes]: {
    example: ['DE', 'FR', 'GB'],
    type: 'string',
  },
  [schemaRefs.rating]: {
    description: 'Video content rating.\n',
    example: 'PG',
    title: 'Rating',
    type: 'string',
  },
  [schemaRefs.ratings]: {
    description:
      'Video content ratings ordered from the least restrictive to the most restrictive.\n',
    example: ['U', 'PG', '12', '15', '18'],
    items: {
      description: 'Video content rating.\n',
      example: 'PG',
      title: 'Rating',
      type: 'string',
    },
    minItems: 1,
    title: 'Ratings',
    type: 'array',
  },
  [schemaRefs.serviceInfo]: {
    properties: {
      application: { type: 'string' },
      checkResults: {
        additionalProperties: {
          additionalProperties: true,
          properties: { isHealthy: { type: 'boolean' } },
          type: 'object',
        },
        type: 'object',
      },
      environment: { type: 'string' },
      version: { type: 'string' },
    },
    required: ['application', 'environment', 'version', 'checkResults'],
    type: 'object',
  },
  [schemaRefs.validationError]: {
    example: missingUserTokenError,
    properties: {
      description: { type: 'string' },
      errorCode: { type: 'string' },
    },
    type: 'object',
  },
  [schemaRefs.validationErrors]: {
    description: 'A list of validation errors.\n',
    example: [missingUserTokenError, securityFailureError],
    items: {
      example: missingUserTokenError,
      properties: {
        description: { type: 'string' },
        errorCode: { type: 'string' },
      },
      required: ['description', 'errorCode'],
      type: 'object',
    },
    minItems: 1,
    title: 'Validation Error',
    type: 'array',
  },
};

const responses = {
  [responseRefs.forbiddenError]: {
    content: {
      'application/json': {
        examples: {
          [exampleRefs.securityFailureResponseBody]:
            examples[exampleRefs.securityFailureResponseBody],
        },
        schema: schemas[schemaRefs.validationErrors],
      },
    },
    description: 'Insufficient privileges for the action\n',
  },
  [responseRefs.invalidInputError]: {
    content: {
      'application/json': {
        examples: {
          [exampleRefs.inputValidationErrorResponseBody]:
            examples[exampleRefs.inputValidationErrorResponseBody],
        },
        schema: schemas[schemaRefs.validationErrors],
      },
    },
    description: 'Invalid input\n',
  },
  [responseRefs.notFoundError]: { description: 'Not found\n' },
  [responseRefs.unauthorizedError]: {
    content: {
      'application/json': {
        examples: {
          [exampleRefs.userTokenMissingResponseBody]:
            examples[exampleRefs.userTokenMissingResponseBody],
        },
        schema: schemas[schemaRefs.validationErrors],
      },
    },
    description: 'Authentication information is missing or invalid\n',
  },
  [responseRefs.unexpectedError]: { description: 'Unexpected error\n' },
};

const securitySchemes = {
  BasicAuth: { scheme: 'basic', type: 'http' },
};

const components = {
  examples,
  parameters,
  responses,
  schemas,
  securitySchemes,
};

const info = {
  description:
    'A web service to allow customers to self-manage the access to their video content. Its main focus is to protect the minors from an exposure to movies not suitable for their age. The goal is achieved by challenging the viewer with a personal identification number before a playout if the content is rated above the desired level. The ratings for films/shows reflect the standards of a country that a customers have their contracts signed in.\n',
  title: 'Parental Control',
  version: '1.0.0',
};

const openapi = '3.0.3';

const paths = {
  '/private/admin/parentalControl': {
    get: {
      parameters: [parameters[parameterRefs.requestIdHeader]],
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: schemas[schemaRefs.countryCodes],
            },
          },
          description: 'List of supported territories.\n',
        },
        '401': responses[responseRefs.unauthorizedError],
        '403': responses[responseRefs.forbiddenError],
        '5XX': responses[responseRefs.unexpectedError],
      },
    },
    parameters: [parameters[parameterRefs.requestIdHeader]],
  },
  '/private/admin/parentalControl/{countryCode}': {
    delete: {
      description:
        'This operation deletes requested territory. After a successful execution, clients from that countries will not be able to use the Parental Control service.\n',
      operationId: 'adminRemoveSupportedTerritory',
      parameters: [
        parameters[parameterRefs.requestIdHeader],
        parameters[parameterRefs.countryCodePathParameter],
      ],
      responses: {
        '204': {
          description: 'Territory removed.\n',
        },
        '400': responses[responseRefs.invalidInputError],
        '401': responses[responseRefs.unauthorizedError],
        '403': responses[responseRefs.forbiddenError],
        '5XX': responses[responseRefs.unexpectedError],
      },
    },
    get: {
      parameters: [
        parameters[parameterRefs.requestIdHeader],
        parameters[parameterRefs.countryCodePathParameter],
      ],
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: schemas[schemaRefs.ratings],
            },
          },
          description: 'Territory classifications\n',
        },
        '400': responses[responseRefs.invalidInputError],
        '401': responses[responseRefs.unauthorizedError],
        '403': responses[responseRefs.forbiddenError],
        '404': responses[responseRefs.notFoundError],
        '5XX': responses[responseRefs.unexpectedError],
      },
    },
    parameters: [
      parameters[parameterRefs.requestIdHeader],
      parameters[parameterRefs.countryCodePathParameter],
    ],
    put: {
      description:
        'This operation sets up content ratings for a given territory.\n',
      operationId: 'adminSetUpSupportedTerritory',
      requestBody: {
        content: {
          'application/json': {
            schema: schemas[schemaRefs.ratings],
          },
        },
      },
      responses: {
        '204': {
          description: 'Territory ratings set up\n',
        },
        '400': responses[responseRefs.invalidInputError],
        '401': responses[responseRefs.unauthorizedError],
        '403': responses[responseRefs.forbiddenError],
        '5XX': responses[responseRefs.unexpectedError],
      },
      tags: ['admin', 'private'],
    },
  },
  '/private/metrics': {
    get: {
      description:
        'This operation provides various metrics which an instnance of the Parental Control service has collected during its lifetime.\n',
      externalDocs: {
        description: 'Prometheus exposition formats documentation\n',
        url: 'https://prometheus.io/docs/instrumenting/exposition_formats/',
      },
      operationId: 'retrieveMetrics',
      responses: {
        '200': {
          content: {
            'text/plain': {
              schema: { type: 'string' },
            },
          },
          description: 'Metrics\n',
        },
        '5XX': responses[responseRefs.unexpectedError],
      },
      summary: 'Produces Prometheus metrics',
      tags: ['metrics', 'private'],
    },
  },
  '/private/ready': {
    get: {
      description:
        'This operation executes a serie of checks against subcomponents vital to its ability to operate. If any of these checks fail the servise should not be considered ready and therefore - no client traffic should be directed to it.',
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: schemas[schemaRefs.serviceInfo],
            },
          },
        },
        '503': {
          content: {
            'application/json': {
              schema: schemas[schemaRefs.serviceInfo],
            },
          },
          description: 'The API is not ready\n',
        },
        '5XX': {
          description: 'Unexpected error\n',
        },
      },
      summary: 'Shows if the API is ready to serve a HTTP traffic',
      tags: ['health', 'private'],
    },
  },
  '/private/status': {
    get: {
      description:
        'This operation does not do more than returning an empty response. It is used by monitoring solution to detect a situation where the service loses its responsiveness and the OS process it operates within requires to be restarted.',
      operationId: 'checkIfLive',
      responses: {
        '204': {
          description: 'The API is responsive\n',
        },
        '5XX': responses[responseRefs.unexpectedError],
      },
      summary: 'Shows if the API is responsive',
      tags: ['health', 'private'],
    },
  },
  '/private/status/info': {
    get: {
      description:
        'This operation provides miscellaneous information regarding settings and fitness of the service.',
      operationId: 'showInfo',
      responses: {
        '200': {
          content: {
            'application/json': {
              schema: schemas[schemaRefs.serviceInfo],
            },
          },
          description: 'Service information\n',
        },
        '5XX': responses[responseRefs.unexpectedError],
      },
    },
  },
};

const servers = [{ url: 'http://localhost:8080' }];

const tags = [
  {
    description:
      'Group of administrative operation giving ability to review and apply configuration of the service.\n',
    name: 'admin',
  },
  {
    description:
      'Group of operation providing an insights into the service fitness.\n',
    name: 'health',
  },
  {
    description:
      'Group of operation providing time based values of various data.\n',
    name: 'metrics',
  },
  {
    description:
      'Group of operation to which access should be restricted at the network configuration level to only monitoring and administrative tools.\n',
    name: 'private',
  },
];

export default { components, info, openapi, paths, servers, tags };
