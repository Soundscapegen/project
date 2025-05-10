/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('Sound', (table) => {
      table.string('preview_url'); // Adds the preview_url column
    });
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema.table('Sound', (table) => {
      table.dropColumn('preview_url');
    });
  };
  