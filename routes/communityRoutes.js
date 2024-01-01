const express = require('express');
const router = express.Router();
const Role = require('../models/roleModel');
const Member = require('../models/memberModel');
const Community = require('../models/communityModel');
const communityMemberRoutes = require('./communityMemberRoutes');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const { Snowflake } = require('@theinternetfolks/snowflake');

const snowflake = new Snowflake();

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

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

      let slug = slugify(name, { lower: true });

      let isSlugUnique = false;
      let slugCounter = 1;

      while (!isSlugUnique) {
        const existingCommunity = await Community.findOne({ slug });

        if (!existingCommunity) {
          isSlugUnique = true;
        } else {
          slug = slugify(`${name}-${slugCounter}`, { lower: true });
          slugCounter += 1;
        }
      }

      const newCommunity = new Community({
        _id: snowflake.generate,
        name,
        slug,
        owner: userId,
      });

      const savedCommunity = await newCommunity.save();

      const communityAdminRole = await Role.findOne({ name: 'Community Admin' });


      if (!communityAdminRole) {
        return res.status(500).json({ error: 'Internal Server Error - Community Admin role not found' });
      }

      const newMember = new Member({
        community: savedCommunity._id,
        user: userId,
        role: communityAdminRole._id,
      });

      await newMember.save();

      const responseFormat = {
        status: true,
        content: {
          data: {
            id: savedCommunity._id,
            name: savedCommunity.name,
            slug: savedCommunity.slug,
            owner: savedCommunity.owner,
            created_at: savedCommunity.created_at,
            updated_at: savedCommunity.updated_at,
          },
        },
      };

      res.json(responseFormat);
    } catch (error) {
      console.error('Error verifying or decoding token:', error.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error creating community:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




const ITEMS_PER_PAGE = 10;

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_PER_PAGE;

    const communities = await Community.find()
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .populate({
        path: 'owner',
        select: 'id name', 
      })
      .select('id name slug owner created_at updated_at');

    const totalCommunities = await Community.countDocuments();

    const totalPages = Math.ceil(totalCommunities / ITEMS_PER_PAGE);

    const responseFormat = {
      status: true,
      content: {
        meta: {
          total: totalCommunities,
          pages: totalPages,
          page: page,
        },
        data: communities,
      },
    };

    res.json(responseFormat);
  } catch (error) {
    res.status(500).json({ status: false, error: 'Error fetching communities' });
  }
});


router.get('/:id/members', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    const skip = (page - 1) * pageSize;

    const members = await Member.find({ community: req.params.id })
      .populate({
        path: 'user',
        select: 'id name',
      })
      .populate({
        path: 'role',
        select: 'id name', 
      })
      .skip(skip)
      .limit(pageSize)
      .select('community user role created_at');

    const totalMembers = await Member.countDocuments({ community: req.params.id });

    const totalPages = Math.ceil(totalMembers / pageSize);

    const meta = {
      total: totalMembers,
      pages: totalPages,
      page: page,
    };

    const responseFormat = {
      status: true,
      content: {
        meta: meta,
        data: members,
      },
    };

    res.json(responseFormat);
  } catch (error) {
    res.status(500).json({ status: false, error: 'Error fetching community members' });
  }
});


router.get('/me/owner', async (req, res) => {
  try {
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

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const communities = await Community.find({ owner: userId })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      const totalCommunities = await Community.countDocuments({ owner: userId });

      const totalPages = Math.ceil(totalCommunities / pageSize);

      res.json({
        status: true,
        content: {
          meta: {
            total: totalCommunities,
            pages: totalPages,
            page: page,
          },
          data: communities,
        },
      });
    } catch (error) {
      console.error('Error verifying or decoding token:', error.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching owner\'s communities:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/me/member', async (req, res) => {
  try {
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

      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const memberCommunities = await Member.find({ user: userId })
        .populate({
          path: 'community',
          select: 'id name slug owner created_at updated_at',
          populate: {
            path: 'owner',
            select: 'id name email created_at',
          },
        })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      const totalJoinedCommunities = await Member.countDocuments({ user: userId });

      const totalPages = Math.ceil(totalJoinedCommunities / pageSize);

     const responseFormat = {
      status: true,
      content: {
        meta: {
          total: totalJoinedCommunities,
          pages: totalPages,
          page: page,
        },
        data: memberCommunities.map(member => ({
          id: member.community.id,
          name: member.community.name,
          slug: member.community.slug,
          owner: {
            id: member.community.owner.id,
            name: member.community.owner.name,
          },
          created_at: member.community.created_at,
          updated_at: member.community.updated_at,
        })),
      },
    };

    res.json(responseFormat);
    } catch (error) {
      console.error('Error verifying or decoding token:', error.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    console.error('Error fetching joined communities:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;

