module.exports = {
  development: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST     || 'postgres',
      database: process.env.DB_NAME     || 'soundscape_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port:     process.env.DB_PORT     || 5432,
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
