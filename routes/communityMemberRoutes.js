const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Member = require('../models/memberModel');
const { Snowflake } = require('@theinternetfolks/snowflake');
const User = require('../models/userModel');

const snowflake = new Snowflake();


router.post('/', async (req, res) => {
  try {
    const { community, user, role } = req.body;

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      const userId = decoded.userId;

      const newMember = new Member({  _id: snowflake.generate,community, user, role, addedBy: userId });

      const savedMember = await newMember.save();

      const responseFormat = {
        status: true,
        content: {
          data: {
            id: savedMember._id,
            community: savedMember.community,
            user: savedMember.user,
            role: savedMember.role,
            created_at: savedMember.created_at,
          }
        }
      };

      res.json(responseFormat);
    } catch (error) {
      console.error('Error verifying or decoding token:', error.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error adding member to community:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded || !decoded.userId) {
        console.error('Invalid token content:', decoded);
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }

      const userId = decoded.userId;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - User not found' });
      }

      const member = await Member.findById(req.params.id);

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      const memberRole = member.role;

      if (!memberRole || (memberRole !== 'Community Admin' && memberRole !== 'Community Moderator')) {
        return res.status(403).json({ error: 'Forbidden - You do not have permission to delete this member' });
      }

      await Member.findByIdAndDelete(req.params.id);

      res.json({ status: true, message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error verifying or decoding token:', error.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error removing member from community:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;
