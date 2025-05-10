/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .table('Soundscape', function(table) {
      table.text('image_url').nullable();
    })
    .table('Sound', function(table) {
      table.dropColumn('image_url');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .table('Sound', function(table) {
      table.text('image_url').nullable();
    })
    .table('Soundscape', function(table) {
      table.dropColumn('image_url');
    });
};
