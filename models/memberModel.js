const { Schema, model } = require('mongoose');

const memberSchema = new Schema({
  community: { type: String, ref: 'Community', required: true },
  user: { type: String, ref: 'User', required: true },
  role: { type: String, ref: 'Role', required: true },
  created_at: { type: Date, default: Date.now },
});

const Member = model('Member', memberSchema);

module.exports = Member;
