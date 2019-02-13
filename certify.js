#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const merge = require('lodash.merge')
const set = require('lodash.set')
const stringify = require('json-stable-stringify');
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

const mapTokens = (tokens, cb) => {
  const res = []
  Object.keys(tokens).forEach(netid =>
    Object.keys(tokens[netid]).forEach(address => res.push(cb(tokens[netid][address], netid)))
  )
  return res
}

async function buildVerifiedTokensMap (mask) {
    const verifiedTokens = {}
    const files = await promisify(glob)(mask, null)
    for (let filename of files) {
    // await Promise.all(files.map(async filename => {
      try {
        const data = await readFile(filename)
        const tokens = JSON.parse(data)
        await Promise.all(mapTokens(tokens, async (token, netid) => {
          if (!token.address || !token.name || !token.symbol || token.decimals == undefined || !token.totalSupply) {
            console.error(`Skipping ${token.address} on file ${path.basename(filename)} for missing details`)
            return
          }
          token.address = token.address.toLowerCase()
          const tokenData = {
            address: token.address,
            totalSupply: token.totalSupply,
            decimals: token.decimals,
            symbol: token.symbol,
            name: token.name,
            verified: '0x01',   // TODO create signature
          }
          set(verifiedTokens, `${netid}.${token.address}`, tokenData)
          try {
            const imgdata = await base64Img(token.address)
            if (imgdata) {
              console.log('Loaded logo for', token.address)
              tokenData.img = imgdata
            }
          } catch (err) {
            console.error(`Missing logo for ${token.name} (${token.address})`)
          }
        }))
      } catch (err) {
        console.error(`Error processing ${filename}`)
        console.error(err)
        process.exit(1)
      }
    }
    return verifiedTokens
}

buildVerifiedTokensMap(path.resolve(__dirname, 'tokens', '*.json'))
.then((verifiedTokens) => promisify(fs.writeFile)(argv.target, stringify(verifiedTokens, { space: 2 })))
.catch(err => {
  console.error(err)
})
