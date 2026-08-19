import * as migration_20260715_231720_initial from './20260715_231720_initial';
import * as migration_20260813_074855_chat_collections from './20260813_074855_chat_collections';
import * as migration_20260814_183043_chat_typing from './20260814_183043_chat_typing';

export const migrations = [
  {
    up: migration_20260715_231720_initial.up,
    down: migration_20260715_231720_initial.down,
    name: '20260715_231720_initial',
  },
  {
    up: migration_20260813_074855_chat_collections.up,
    down: migration_20260813_074855_chat_collections.down,
    name: '20260813_074855_chat_collections',
  },
  {
    up: migration_20260814_183043_chat_typing.up,
    down: migration_20260814_183043_chat_typing.down,
    name: '20260814_183043_chat_typing'
  },
];
