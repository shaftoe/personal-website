const { argv } = require("process")
const fs = require("fs")
const toml = require("toml")

fs.writeFileSync(argv[2], `"use strict"
const currencies = ${JSON.stringify(
    toml.parse(
        fs.readFileSync('config.toml', { encoding: "utf-8" }))
        .params.currencies.map(element => element[0]))}
`)
