const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { Snowflake } = require('@theinternetfolks/snowflake');

const snowflake = new Snowflake();


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      _id:snowflake.generate,
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    savedUser.password = undefined;

    res.status(201).json({ message: 'User signed up successfully', user: savedUser, meta: { access_token: token } });
  } catch (error) {
    console.error('Error signing up user:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: false, error: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ status: false, error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };

    res.status(200).json({
      status: true,
      content: {
        data: userResponse,
        meta: {
          access_token: token,
        },
      },
    });
  } catch (error) {
    console.error('Error signing in user:', error.message);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
}); 


router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const currentUser = await User.findById(userId);

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      currentUser.password = undefined;

            const responseFormat = {
              status: true,
              content: {
                data: {
                  id: currentUser._id,
                  name: currentUser.name,
                  email: currentUser.email,
                  created_at: currentUser.created_at,
                },
              },
            };
      

      res.json(responseFormat);
    } catch (error) {
      console.error('Error verifying or decoding token:', error.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching current user:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
