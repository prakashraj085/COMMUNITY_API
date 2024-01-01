const { Schema, model } = require('mongoose');
const { Snowflake } = require('@theinternetfolks/snowflake');

const snowflake = new Snowflake(); 

const communitySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  owner: { type: String, default: function () { return snowflake.generate } }, 
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Community = model('Community', communitySchema);

module.exports = Community;
