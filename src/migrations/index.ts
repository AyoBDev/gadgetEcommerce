import * as migration_20260715_231720_initial from './20260715_231720_initial';
import * as migration_20260813_074855_chat_collections from './20260813_074855_chat_collections';

export const migrations = [
  {
    up: migration_20260715_231720_initial.up,
    down: migration_20260715_231720_initial.down,
    name: '20260715_231720_initial',
  },
  {
    up: migration_20260813_074855_chat_collections.up,
    down: migration_20260813_074855_chat_collections.down,
    name: '20260813_074855_chat_collections'
  },
];
