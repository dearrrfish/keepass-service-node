KSAPI - KeePass Service API
====================

Node learning project. KeePass lookup service.


## Usage:

- Clone to anywhere
- Edit `config/user.json` following example of `user.example.json`
- Start server by `npm start`
- Exit server by `npm exit`

## API

Endpoint-base: `host:port/api/:secret`

- `/cache/update` - reload and update KeePass database into cache
- `/search/:query` - search by formatted query string, e.g. "aws title:google url:amazon.com"
- `/get/:uuid/:field` - get entry information, `:field` is optional, default to return full entry
- more...

## TODO

- switch between multiple databases
- encryption
- more cli commands
- web front-end
