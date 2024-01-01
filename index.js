const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const authRoutes = require('./routes/authRoutes');
const communityRoutes = require('./routes/communityRoutes');
const roleRoutes = require('./routes/roleRoutes');
const communityMemberRoutes = require('./routes/communityMemberRoutes');

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (error) => {
    console.error('MongoDB Connection Error:', error.message);
  });
  
  mongoose.connection.on('open', () => {
    console.log('Connected to MongoDB successfully!');
  });


app.use('/v1/auth', authRoutes);
app.use('/v1/community', communityRoutes);
app.use('/v1/role', roleRoutes);
app.use('/v1/member', communityMemberRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
