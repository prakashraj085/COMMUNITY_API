const express = require('express');
const router = express.Router();

const { Snowflake } = require('@theinternetfolks/snowflake');

const Role = require('../models/roleModel');


const snowflake = new Snowflake();

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    const existingRole = await Role.findOne({ name });

    if (existingRole) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }

    const newRole = new Role({
      _id: snowflake.generate, 
      name,
    });

    const savedRole = await newRole.save();

     const responseFormat = {
      status: true,
      content: {
        data: {
          id: savedRole._id,
          name: savedRole.name,
          created_at: savedRole.created_at,
          updated_at: savedRole.updated_at,
        },
      },
    };

    res.json(responseFormat);
  } catch (error) {
    res.status(500).json({ error: 'Error creating role' });
  }
});

const ITEMS_PER_PAGE = 10;

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * ITEMS_PER_PAGE;

    const roles = await Role.find().skip(skip).limit(ITEMS_PER_PAGE);

    const totalRoles = await Role.countDocuments();

    const totalPages = Math.ceil(totalRoles / ITEMS_PER_PAGE);

    const responseFormat = {
      status: true,
      content: {
        meta: {
          total: totalRoles,
          pages: totalPages,
          page: page,
        },
        data: roles.map((role) => ({
          id: role._id,
          name: role.name,
          created_at: role.created_at,
          updated_at: role.updated_at,
        })),
      },
    };

    res.json(responseFormat);
  } catch (error) {
    console.error('Error fetching roles:', error.message);
    res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
});


module.exports = router;
