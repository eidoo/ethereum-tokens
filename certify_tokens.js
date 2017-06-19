'use strict';

// This file will go through the addresses list, fetch token data from tokens_cache.json file and generate
// the file we use to certify tokens. A logo can be associated to the token storing an svg file in the img
// directory using the token address as file name

const fs = require('fs')
const path = require('path');


const addresses = [
  "0xa74476443119A942dE498590Fe1f2454d7D4aC0d",
  "0x48c80F1f4D53D5951e5D5438B54Cba84f29F32a5",
  "0xc66ea802717bfb9833400264dd12c2bceaa34a6d",
  "0x6810e776880c02933d47db1b9fc05908e5386b96",
  "0xD8912C10681D8B21Fd3742244f44658dBA12264E",
  "0x0D8775F648430679A709E98d2b0Cb6250d2887EF",
  "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a",
  "0x888666CA69E0f178DED6D75b5726Cee99A87D698",
  "0xaec2e87e0a235266d9c5adc9deb4b2e29b54d009",
  "0x960b236A07cf122663c4303350609A66A7B288C0",
  "0xAf30D2a7E90d7DC361c8C4585e9BB7D2F6f15bc7",
  "0x667088b212ce3d06a1b553a7221E1fD19000d9aF",
  "0xBEB9eF514a379B997e0798FDcC901Ee474B6D9A1",
  "0x607F4C5BB672230e8672085532f7e901544a7375",
  "0x4DF812F6064def1e5e029f1ca858777CC98D2D81",
  "0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b",
  "0xb9e7f8568e08d5659f5d29c4997173d84cdf2607",
  "0xf7b098298f7c69fc14610bf71d5e02c60792894c",
  "0xe7775a6e9bcf904eb39da2b68c5efb4f9360e08c",
  "0x08711d3b02c8758f2fb3ab4e80228418a7f8e39c",
  "0x5c543e7AE0A1104f78406C340E9C64FD9fCE5170",
  "0xaaaf91d9b90df800df4f55c205fd6989c977e73a",
  "0xff3519eeeea3e76f1f699ccce5e23ee0bdda41ac",
  "0x6531f133e6DeeBe7F2dcE5A0441aA7ef330B4e53",
  "0xfa05A73FfE78ef8f1a739473e462c54bae6567D9",
  "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C"
]
const tokenCache = JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens_cache.json'))).tokens
const tokens = {"1": {}}

addresses.forEach(token => {
  const cachedToken = tokenCache[token.toLowerCase()];
  if(!cachedToken) {
    console.error(`Missing token ${token}`)
    return
  }

  const tokenData = {
    address: cachedToken.address,
    totalSupply: cachedToken.totalSupply,
    decimals: cachedToken.decimals,
    symbol: cachedToken.symbol,
    name: cachedToken.name,
    verified: '0x01',
  }

  const img = base64Img(cachedToken.address)
  if(img) {
    tokenData.img = img
  }

  tokens[1][token] = tokenData
})

fs.writeFileSync(path.join(__dirname, 'certified_tokens.json'), JSON.stringify(tokens))

function base64Img(token) {
  try {
    const svg = fs.readFileSync(path.join(__dirname, 'img', `${token}.svg`))
    return `data:image/svg+xml;base64,${svg.toString('base64')}`
  }catch(e) {
    console.error(`Missing logo for ${token}`)
  }
}