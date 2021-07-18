export default {
  given: {
    cassandra: {
      present: [
        {
          scenarioRefHash: '08fc22bf09203709115ae82002615b71',
          spec: {
            contactPoint: '{{ cassandraContactPoint | EXT }}',
            data: {
              countryCode: '{{ .path.countryCode | REQ }}',
              values: '["A","B","C"]',
            },
            keyspace: '{{ cassandraKeyspace | EXT }}',
            localDataCenter: '{{ cassandraLocalDataCenter | EXT }}',
            table: 'ratings',
          },
        },
      ],
    },
  },
  then: {
    cassandra: {
      absent: [
        {
          scenarioRefHash: '08fc22bf09203709115ae82002615b71',
          spec: {
            contactPoint: '{{ cassandraContactPoint | EXT }}',
            data: ['countryCode', 'values'],
            keyspace: '{{ cassandraKeyspace | EXT }}',
            localDataCenter: '{{ cassandraLocalDataCenter | EXT }}',
            table: 'ratings',
          },
        },
      ],
      present: [],
    },
  },
};
