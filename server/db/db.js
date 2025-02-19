const knex = require('knex');
const knexfile = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';

const config = knexfile[environment];

const db = knex(config);

module.exports = db;
