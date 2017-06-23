#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const merge = require('lodash.merge')

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

const base64Img = (address) => promisify(fs.readFile)(path.join(__dirname, 'img', `${address}.svg`))
  .then(svg => `data:image/svg+xml;base64,${svg.toString('base64')}`)

const mask = path.resolve(__dirname, 'tokens', '*.json')
const tokens = {}

promisify(glob)(mask, null)
.then(files => Promise.all(files.map(filename =>
  promisify(fs.readFile)(filename)
  .then(data => merge(tokens, JSON.parse(data)))
)))
.then(() => {
  const loadImages = []
  Object.keys(tokens).forEach(netid => {
    Object.keys(tokens[netid]).forEach(address => {
      loadImages.push(
        base64Img(address)
        .then(imgdata => {
          if (imgdata) {
            console.log('Loaded logo for', address)
            tokens[netid][address].img = imgdata
          }
        })
        .catch(() => console.error(`Missing logo for ${address}`))
      )
    })
  })
  return Promise.all(loadImages)
})
.then(() => promisify(fs.writeFile)(argv.target, JSON.stringify(tokens, null, 2)))
.catch(err => {
  console.error(err)
})

