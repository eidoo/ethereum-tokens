#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const argv = require('yargs')
  .alias('h', 'help')
  .alias('d', 'destination')
  .default('destination', './tokens')
  .alias('s', 'source')
  .default('network', '1')
  .demandOption('source').argv

const tokens = JSON.parse(fs.readFileSync(path.resolve(argv.source)))[
  argv.network
]

Object.keys(tokens).forEach((address) => {
  const token = tokens[address]
  delete token.verified
  delete token.img
  let filename = path.resolve(argv.destination, `${address}.json`)
  let data = JSON.stringify(
    {
      [argv.network]: {
        [address]: token,
      },
    },
    null,
    2
  )
  fs.writeFile(filename, data, (err) => err && console.error(err))
})
