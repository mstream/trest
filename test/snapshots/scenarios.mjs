export default {
  '08fc22bf09203709115ae82002615b71': {
    given: {
      cassandra: {
        present: [
          {
            contactPoint: '{{ cassandraContactPoint | EXT }}',
            data: {
              countryCode: '{{ .path.countryCode | REQ }}',
              values: '["A","B","C"]',
            },
            keyspace: '{{ cassandraKeyspace | EXT }}',
            localDataCenter: '{{ cassandraLocalDataCenter | EXT }}',
            table: 'ratings',
          },
        ],
      },
    },
    name: 'Removing an existing territory',
    then: {
      cassandra: {
        absent: [
          {
            contactPoint: '{{ cassandraContactPoint | EXT }}',
            data: ['countryCode', 'values'],
            keyspace: '{{ cassandraKeyspace | EXT }}',
            localDataCenter: '{{ cassandraLocalDataCenter | EXT }}',
            table: 'ratings',
          },
        ],
      },
      response: {
        statusCode: '204',
      },
    },
  },
  'd01468c87c6f33af2ead1533758a3640': {
    name: 'Removing a non-existent territory',
    then: {
      response: {
        statusCode: '204',
      },
    },
  },
};
