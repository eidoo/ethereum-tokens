#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const merge = require('lodash.merge')
const set = require('lodash.set')
const Web3 = require('web3')
const toChecksumAddress = Web3.prototype.toChecksumAddress

const argv = require('yargs')
  .alias('h', 'help')
  .alias('t', 'target')
  .demandOption('target')
  .argv

const promisify = fn => (...args) => new Promise((resolve, reject) => {
  try {
   fn(...args, (err, res) => {
      if (err) reject(err)
      else resolve(res)
    })
  } catch (err) {
    reject(err)
  }
})

const readFile = promisify(fs.readFile)

const base64Img = (address) =>
  readFile(path.join(__dirname, 'img', `${address}.svg`))
  .catch(() => readFile(path.join(__dirname, 'img', `${toChecksumAddress(address)}.svg`)))
  .then(svg => `data:image/svg+xml;base64,${svg.toString('base64')}`)

const mask = path.resolve(__dirname, 'tokens', '*.json')
const verifiedTokens = {}

const mapTokens = (tokens, cb) => {
  const res = []
  Object.keys(tokens).forEach(netid =>
    Object.keys(tokens[netid]).forEach(address => res.push(cb(tokens[netid][address], netid)))
  )
  return res
}

promisify(glob)(mask, null)
.then(files => Promise.all(files.map(filename =>
  readFile(filename)
  .then(data => JSON.parse(data))
  .then(tokens =>
    Promise.all(mapTokens(tokens, (token, netid) => {
      if (!token.address || !token.name || !token.symbol || token.decimals == undefined || !token.totalSupply) {
        console.error(`Skipping ${token.address} on file ${path.basename(filename)} for missing details`)
        return
      }
      const tokenData = {
        address: token.address,
        totalSupply: token.totalSupply,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
        verified: '0x01',   // TODO create signature
      }
      set(verifiedTokens, `${netid}.${token.address}`, tokenData)
      return base64Img(token.address)
        .then(imgdata => {
          if (imgdata) {
            console.log('Loaded logo for', token.address)
            tokenData.img = imgdata
          }
        })
        .catch(() => console.error(`Missing logo for ${token.address}`))
    }))
  )
)))
.then(() => promisify(fs.writeFile)(argv.target, JSON.stringify(verifiedTokens, null, 2)))
.catch(err => {
  console.error(err)
})
