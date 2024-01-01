const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: { type: String, default: null },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});


const User = model('User', userSchema);

module.exports = User;
