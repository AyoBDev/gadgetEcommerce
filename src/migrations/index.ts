import * as migration_20260715_231720_initial from './20260715_231720_initial';

export const migrations = [
  {
    up: migration_20260715_231720_initial.up,
    down: migration_20260715_231720_initial.down,
    name: '20260715_231720_initial'
  },
];
