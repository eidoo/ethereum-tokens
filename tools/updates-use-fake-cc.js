#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const promisify = require('../utils/promisfy')
const stringify = require('json-stable-stringify')
const argv = require('yargs').alias('h', 'help').demandOption('useFakeCC').argv
const readFile = promisify(fs.readFile)

const mask = path.resolve(__dirname, '../tokens', '*.json')
promisify(glob)(mask, null)
  .then((_files) =>
    Promise.all(
      _files.map((_file) =>
        readFile(_file)
          // prettier-ignore
          .then((_data) => {
            const tokens = JSON.parse(_data)
            Object.keys(tokens).forEach((_netid) =>
              Object.keys(tokens[_netid]).forEach(
                (address) =>
                  (tokens[_netid][address] = {
                    ...tokens[_netid][address],
                    useFakeCC: Boolean(argv.useFakeCC),
                  })
              )
            )
            console.log(tokens)
            return promisify(fs.writeFile)(
              _file,
              stringify(tokens, { space: 2 })
            )
          })
      )
    )
  )
  .then(() => console.log('Finished!'))
  .catch((err) => {
    console.error(err)
  })
