const { Schema, model } = require('mongoose');


const roleSchema = new Schema({
  name: { type: String, unique: true, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  
});

const Role = model('Role', roleSchema);

module.exports = Role;
