import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import {
  MongoJoinArticles,
  MongoJoinNotes,
  MongoJoinParents,
  MongoJoinUsers,
} from './collections/MongoPolymorphicAggregation.js'

export default buildConfigWithDefaults({
  suite: 'mongo-polymorphic-aggregation',
  config: {
    collections: [MongoJoinArticles, MongoJoinNotes, MongoJoinParents, MongoJoinUsers],
  },
})
