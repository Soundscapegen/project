require('dotenv').config(); // Ensure environment variables are loaded

exports.seed = async function(knex) {
    // Deletes ALL existing entries (if needed)
    await knex('Sound').del();
    
    // Inserts seed entries
    await knex('Sound').insert([
      {
        sound_id: 1, // or use UUIDs / serial IDs depending on your setup
        name: 'Birds in the sky',
        description: 'Soundscape of the birds chirping on the tree',
        preview_url: 'https://cdn.freesound.org/previews/327/327444_4028726-hq.mp3',
        image_url: '/birdflying.jpg',
        source_url: `https://freesound.org/apiv2/sounds/327444/download/?token=${process.env.FREESOUND_API_KEY}` 
      },
      {
        sound_id: 2,
        name: 'Lo-fi',
        description: 'Chill lo-fi beats to study to',
        preview_url: 'https://cdn.freesound.org/previews/659/659451_13228046-hq.mp3',
        image_url: '/rainlights.jpg',
        source_url: `https://freesound.org/apiv2/sounds/659451/download/?token=${process.env.FREESOUND_API_KEY}`
      },
      {
        sound_id: 3, 
        name: 'Piano soundscape',
        description: 'Chill Lo-Fi',
        preview_url: 'https://cdn.freesound.org/previews/763/763525_16085454-hq.mp3',
        image_url: '/spaceshipFlying.jpg',
        source_url: `https://freesound.org/apiv2/sounds/763525/download/?token=${process.env.FREESOUND_API_KEY}`
      }
    ]);
  };
  