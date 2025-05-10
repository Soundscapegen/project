/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.raw(`
      -- Fix sequence for Sound table to ensure new IDs start after existing max ID
      SELECT setval('"Sound_sound_id_seq"', (SELECT MAX(sound_id) FROM "Sound"), true);
      
      -- Fix sequence for Soundscape table to ensure new IDs start after existing max ID
      SELECT setval('"Soundscape_soundscape_id_seq"', (SELECT MAX(soundscape_id) FROM "Soundscape"), true);
      
      -- Ensure preview_url column exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Sound' AND column_name = 'preview_url'
        ) THEN
          ALTER TABLE "Sound" ADD COLUMN preview_url TEXT;
        END IF;
      END $$;
      
      -- Ensure image_url column exists in Soundscape table
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'Soundscape' AND column_name = 'image_url'
        ) THEN
          ALTER TABLE "Soundscape" ADD COLUMN image_url TEXT;
        END IF;
      END $$;
    `);
  };
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return Promise.resolve();
  };