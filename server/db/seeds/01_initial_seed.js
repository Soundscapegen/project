/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('SoundscapeSound').del();
  await knex('Soundscape').del();
  await knex('Sound').del();
  
  // Insert Sounds
  const sounds = [
    // River Flowing Sounds
    {
      sound_id: 1,
      source_url: 'https://cdn.freesound.org/previews/263/263950_4492515-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744645731796.mp3',
      name: 'Glass Water Bubbles',
      description: 'Sound from https://cdn.freesound.org/previews/263/263950_4492515-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/263/263950_4492515-hq.mp3'
    },
    {
      sound_id: 2,
      source_url: 'https://cdn.freesound.org/previews/263/263947_4492515-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744645731773.mp3',
      name: 'Glass Water Bubbles',
      description: 'Sound from https://cdn.freesound.org/previews/263/263947_4492515-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/263/263947_4492515-hq.mp3'
    },
    {
      sound_id: 3,
      source_url: 'https://cdn.freesound.org/previews/387/387950_1738686-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744645731568.mp3',
      name: 'Straw Water Bubbles',
      description: 'Sound from https://cdn.freesound.org/previews/387/387950_1738686-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/387/387950_1738686-hq.mp3'
    },
    {
      sound_id: 4,
      source_url: 'https://cdn.freesound.org/previews/660/660258_11673893-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744645731763.mp3',
      name: 'Waterfall Into River',
      description: 'Sound from https://cdn.freesound.org/previews/660/660258_11673893-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/660/660258_11673893-hq.mp3'
    },
    {
      sound_id: 5,
      source_url: 'https://cdn.freesound.org/previews/145/145395_2607024-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744645731802.mp3',
      name: 'Flowing River',
      description: 'Sound from https://cdn.freesound.org/previews/145/145395_2607024-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/145/145395_2607024-hq.mp3'
    },
    {
      sound_id: 6,
      source_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744645731788.mp3',
      name: 'Forest River Bells Joggers',
      description: 'Sound from https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3'
    },
    // Spaceship in Flight Sounds
    {
      sound_id: 7,
      source_url: 'https://cdn.freesound.org/previews/169/169859_1015240-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744650905662.mp3',
      name: 'Deep Pulsating Hum',
      description: 'Sound from https://cdn.freesound.org/previews/169/169859_1015240-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/169/169859_1015240-hq.mp3'
    },
    {
      sound_id: 8,
      source_url: 'https://cdn.freesound.org/previews/241/241264_3678662-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744650905570.mp3',
      name: 'Spaceship Ambience',
      description: 'Sound from https://cdn.freesound.org/previews/241/241264_3678662-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/241/241264_3678662-hq.mp3'
    },
    {
      sound_id: 9,
      source_url: 'https://cdn.freesound.org/previews/428/428465_7052663-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744650905653.mp3',
      name: 'Rumbling Engine 1',
      description: 'Sound from https://cdn.freesound.org/previews/428/428465_7052663-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/428/428465_7052663-hq.mp3'
    },
    {
      sound_id: 10,
      source_url: 'https://cdn.freesound.org/previews/428/428463_7052663-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744650905679.mp3',
      name: 'Rumbling Engine 3',
      description: 'Sound from https://cdn.freesound.org/previews/428/428463_7052663-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/428/428463_7052663-hq.mp3'
    },
    {
      sound_id: 11,
      source_url: 'https://cdn.freesound.org/previews/428/428466_7052663-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744650905684.mp3',
      name: 'Rumbling Engine 2',
      description: 'Sound from https://cdn.freesound.org/previews/428/428466_7052663-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/428/428466_7052663-hq.mp3'
    },
    {
      sound_id: 12,
      source_url: 'https://cdn.freesound.org/previews/609/609830_13392814-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744650905655.mp3',
      name: 'Refrigerator Drone',
      description: 'Sound from https://cdn.freesound.org/previews/609/609830_13392814-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/609/609830_13392814-hq.mp3'
    },
    // Sunny Day Sounds
    {
      sound_id: 14,
      source_url: 'https://cdn.freesound.org/previews/327/327447_4028726-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/13_1744651370202.mp3',
      name: 'Birds Chirping, City Background',
      description: 'Sound from https://cdn.freesound.org/previews/327/327447_4028726-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/327/327447_4028726-hq.mp3'
    },
    {
      sound_id: 15,
      source_url: 'https://cdn.freesound.org/previews/327/327445_4028726-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744651370220.mp3',
      name: 'Birds Chirping, City Background',
      description: 'Sound from https://cdn.freesound.org/previews/327/327445_4028726-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/327/327445_4028726-hq.mp3'
    },
    {
      sound_id: 16,
      source_url: 'https://cdn.freesound.org/previews/489/489933_10570192-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744651370237.mp3',
      name: 'Leaves Rustling',
      description: 'Sound from https://cdn.freesound.org/previews/489/489933_10570192-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/489/489933_10570192-hq.mp3'
    },
    {
      sound_id: 17,
      source_url: 'http://localhost:3001/sounds/209207_1744651330549.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744651370208.mp3',
      name: 'Windy autumn - bicycle arriving and hand-breaking three times and going up the curb.wav',
      description: 'Sound from http://localhost:3001/sounds/209207_1744651330549.mp3',
      preview_url: 'http://localhost:3001/sounds/209207_1744651330549.mp3'
    },
    {
      sound_id: 18,
      source_url: 'https://cdn.freesound.org/previews/489/489937_10570192-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744651370225.mp3',
      name: 'Leaves Rustling Quickly',
      description: 'Sound from https://cdn.freesound.org/previews/489/489937_10570192-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/489/489937_10570192-hq.mp3'
    },
    // Rainy Forest Walk Sounds
    {
      sound_id: 19,
      source_url: 'https://cdn.freesound.org/previews/387/387950_1738686-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744998591360.mp3',
      name: 'Subtle Distant Thunder',
      description: 'Sound from https://cdn.freesound.org/previews/387/387950_1738686-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/387/387950_1738686-hq.mp3'
    },
    {
      sound_id: 20,
      source_url: 'https://cdn.freesound.org/previews/660/660258_11673893-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744998591369.mp3',
      name: 'Autumn Leaves Footsteps',
      description: 'Sound from https://cdn.freesound.org/previews/660/660258_11673893-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/660/660258_11673893-hq.mp3'
    },
    {
      sound_id: 21,
      source_url: 'https://cdn.freesound.org/previews/145/145395_2607024-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744998591349.mp3',
      name: 'Distant Rain Thunder',
      description: 'Sound from https://cdn.freesound.org/previews/145/145395_2607024-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/145/145395_2607024-hq.mp3'
    },
    {
      sound_id: 22,
      source_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744998591354.mp3',
      name: 'Autumn Leaves Footsteps',
      description: 'Sound from https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3'
    },
    {
      sound_id: 23,
      source_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744998591374.mp3',
      name: 'Distant Thunder Rain',
      description: 'Sound from https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3'
    },
    {
      sound_id: 24,
      source_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1744998591346.mp3',
      name: 'Autumn Leaves Footsteps',
      description: 'Sound from https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/758/758785_2061858-hq.mp3'
    },
    // Construction Site Sounds
    {
      sound_id: 25,
      source_url: 'https://cdn.freesound.org/previews/119/119809_1059930-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1745000222343.mp3',
      name: 'Distant Jackhammer',
      description: 'Sound from https://cdn.freesound.org/previews/119/119809_1059930-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/119/119809_1059930-hq.mp3'
    },
    {
      sound_id: 26,
      source_url: 'https://cdn.freesound.org/previews/132/132016_2268897-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1745000222337.mp3',
      name: 'Street Music vs. Jackhammer',
      description: 'Sound from https://cdn.freesound.org/previews/132/132016_2268897-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/132/132016_2268897-hq.mp3'
    },
    {
      sound_id: 27,
      source_url: 'https://cdn.freesound.org/previews/619/619094_781461-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1745000222324.mp3',
      name: 'Construction Saw Machinery',
      description: 'Sound from https://cdn.freesound.org/previews/619/619094_781461-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/619/619094_781461-hq.mp3'
    },
    {
      sound_id: 28,
      source_url: 'https://cdn.freesound.org/previews/779/779890_1661766-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1745000222334.mp3',
      name: 'Echoing Jackhammer Screeches',
      description: 'Sound from https://cdn.freesound.org/previews/779/779890_1661766-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/779/779890_1661766-hq.mp3'
    },
    {
      sound_id: 29,
      source_url: 'https://cdn.freesound.org/previews/726/726334_14079354-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1745000222328.mp3',
      name: 'Gardening Construction Machinery',
      description: 'Sound from https://cdn.freesound.org/previews/726/726334_14079354-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/726/726334_14079354-hq.mp3'
    },
    {
      sound_id: 30,
      source_url: 'https://cdn.freesound.org/previews/726/726344_14079354-hq.mp3',
      freesound_id: 0,
      file_path: '/sounds/0_1745000222212.mp3',
      name: 'Gardening Construction Ambience',
      description: 'Sound from https://cdn.freesound.org/previews/726/726344_14079354-hq.mp3',
      preview_url: 'https://cdn.freesound.org/previews/726/726344_14079354-hq.mp3'
    }
  ];
  
  // Insert sounds into database
  await knex('Sound').insert(sounds);
  
  // Insert Soundscape
  const soundscapes = [
    {
      soundscape_id: 1,
      name: 'River Flowing',
      description: 'River Flowing Soundscape',
      is_preset: true,
      image_url: 'https://images.unsplash.com/photo-1642786842195-29e65bd0d0d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3MzY0OTh8MHwxfHNlYXJjaHwxfHxSaXZlciUyMGZsb3dpbmclMjAtJTIwV2F0ZXIlMjBidWJibGluZ3xlbnwwfHx8fDE3NDQ2NDU2NDh8MA&ixlib=rb-4.0.3&q=80&w=400',
      tags: ['Nature', 'Water', 'Calming', 'Relaxing', 'Outdoors']
    },
    {
      soundscape_id: 2,
      name: 'Spaceship in Flight',
      description: 'Spaceship in Flight Soundscape',
      is_preset: true,
      image_url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400',
      tags: ['Sci-Fi', 'Ambient', 'Machine', 'Space', 'Futuristic']
    },
    {
      soundscape_id: 3,
      name: 'Sunny Day',
      description: 'Sunny Day Soundscape',
      is_preset: true,
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400',
      tags: ['Nature', 'Birds', 'Outdoors', 'Calming', 'Daytime']
    },
    {
      soundscape_id: 4,
      name: 'Rainy Forest Walk',
      description: 'Rainy Forest Walk Soundscape',
      is_preset: true,
      image_url: 'https://images.unsplash.com/photo-1532690505755-416f854618da?q=80&fm=jpg&fit=crop&w=400&h=300&crop=entropy&cs=tinysrgb',
      tags: ['Nature', 'Rain', 'Forest', 'Thunder', 'Relaxing']
    },
    {
      soundscape_id: 5,
      name: 'Construction Site',
      description: 'Construction Site Soundscape',
      is_preset: true,
      image_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&fm=jpg&fit=crop&w=400&h=300&crop=entropy&cs=tinysrgb',
      tags: ['Urban', 'Noise', 'Machinery', 'Industrial', 'City']
    }
  ];
  
  // Insert soundscapes into database
  await knex('Soundscape').insert(soundscapes);
  
  // Insert SoundscapeSound associations
  const soundscapeSounds = [
    // River Flowing Soundscape
    {
      soundscape_id: 1,
      sound_id: 1,
      volume: 3.00,
      pan: 0.00
    },
    {
      soundscape_id: 1,
      sound_id: 2,
      volume: -5.00,
      pan: 0.00
    },
    {
      soundscape_id: 1,
      sound_id: 3,
      volume: -1.00,
      pan: 0.00
    },
    {
      soundscape_id: 1,
      sound_id: 4,
      volume: -12.00,
      pan: 0.00
    },
    {
      soundscape_id: 1,
      sound_id: 5,
      volume: 13.00,
      pan: 0.00
    },
    {
      soundscape_id: 1,
      sound_id: 6,
      volume: 4.00,
      pan: 0.00
    },
    // Spaceship in Flight Soundscape
    {
      soundscape_id: 2,
      sound_id: 7,
      volume: -10.00,
      pan: 0.00
    },
    {
      soundscape_id: 2,
      sound_id: 8,
      volume: -12.00,
      pan: 0.00
    },
    {
      soundscape_id: 2,
      sound_id: 9,
      volume: 6.00,
      pan: 0.00
    },
    {
      soundscape_id: 2,
      sound_id: 10,
      volume: 6.00,
      pan: 0.00
    },
    {
      soundscape_id: 2,
      sound_id: 11,
      volume: 1.00,
      pan: 0.00
    },
    {
      soundscape_id: 2,
      sound_id: 12,
      volume: -9.00,
      pan: 0.00
    },
    // Sunny Day Soundscape
    {
      soundscape_id: 3,
      sound_id: 14,
      volume: -20.00,
      pan: 0.00
    },
    {
      soundscape_id: 3,
      sound_id: 15,
      volume: -8.00,
      pan: 0.00
    },
    {
      soundscape_id: 3,
      sound_id: 16,
      volume: -8.00,
      pan: 0.00
    },
    {
      soundscape_id: 3,
      sound_id: 17,
      volume: 11.00,
      pan: 0.00
    },
    {
      soundscape_id: 3,
      sound_id: 18,
      volume: -1.00,
      pan: 0.00
    },
    // Rainy Forest Walk Soundscape
    {
      soundscape_id: 4,
      sound_id: 19,
      volume: -2.00,
      pan: 0.00
    },
    {
      soundscape_id: 4,
      sound_id: 20,
      volume: -9.00,
      pan: 0.00
    },
    {
      soundscape_id: 4,
      sound_id: 21,
      volume: -12.00,
      pan: 0.00
    },
    {
      soundscape_id: 4,
      sound_id: 22,
      volume: -9.00,
      pan: 0.00
    },
    {
      soundscape_id: 4,
      sound_id: 23,
      volume: -11.00,
      pan: 0.00
    },
    {
      soundscape_id: 4,
      sound_id: 24,
      volume: -12.00,
      pan: 0.00
    },
    // Construction Site Soundscape
    {
      soundscape_id: 5,
      sound_id: 25,
      volume: 6.00,
      pan: 0.00
    },
    {
      soundscape_id: 5,
      sound_id: 26,
      volume: -4.00,
      pan: 0.00
    },
    {
      soundscape_id: 5,
      sound_id: 27,
      volume: -11.00,
      pan: 0.00
    },
    {
      soundscape_id: 5,
      sound_id: 28,
      volume: 4.00,
      pan: 0.00
    },
    {
      soundscape_id: 5,
      sound_id: 29,
      volume: -11.00,
      pan: 0.00
    },
    {
      soundscape_id: 5,
      sound_id: 30,
      volume: -11.00,
      pan: 0.00
    }
  ];
  
  // Insert soundscape-sound associations into database
  await knex('SoundscapeSound').insert(soundscapeSounds);
  
  // Reset sequence for Sound table to avoid primary key conflicts on new insertions
  await knex.raw(`SELECT setval('"Sound_sound_id_seq"', (SELECT MAX(sound_id) FROM "Sound"), true);`);
  
  // Reset sequence for Soundscape table to avoid primary key conflicts on new insertions
  await knex.raw(`SELECT setval('"Soundscape_soundscape_id_seq"', (SELECT MAX(soundscape_id) FROM "Soundscape"), true);`);
}; 