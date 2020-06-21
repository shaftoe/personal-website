const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mastodon = {
  accountId: process.env.MASTODON_ACCOUNT_ID,
  apiBaseUrl: 'https://fosstodon.org/api/v1/',
  folder: 'content/mastodon'
}
mastodon.url = `accounts/${mastodon.accountId}/statuses`

const requestConfig = {
  url: mastodon.url,
  baseURL: mastodon.apiBaseUrl,
}

function cleanDir(directory, regex=/.+/) {
  fs.readdirSync(directory)
    .filter(file => file.match(regex))
    .forEach(file => {
      const _file = path.join(directory, file)
      console.debug(`Deleting ${_file}`)
      fs.unlinkSync(_file)
    })
}

function formatMarkdown(id, created_at, url, content) {
  return `---
title: ${id}
date: ${created_at}
src_url: ${url}
---

${content}\n`
}

function writeMdFile(id, created_at, url, content) {
  const md = formatMarkdown(id, created_at, url, content)
  const file = path.join(mastodon.folder, `${id}.html`)
  console.debug(`Writing ${file}`)
  fs.writeFileSync(file, md)
}

axios.request(requestConfig).then(function (response) {
  cleanDir(mastodon.folder, /\.html$/)
  response.data.forEach(el => writeMdFile(el.id, el.created_at, el.url, el.content))
})
