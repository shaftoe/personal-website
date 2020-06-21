const axios = require('axios');
const fs = require('fs');
const path = require('path');

const mastodon = {
  accountId: 36187,
  apiBaseUrl: 'https://fosstodon.org/api/v1/',
  folder: 'content/mastodon'
}
mastodon.url = `accounts/${mastodon.accountId}/statuses`

const requestConfig = {
  url: mastodon.url,
  baseURL: mastodon.apiBaseUrl,
}

const throwIfErr = (err) => { if (err) throw err }

function cleanDir(directory, regex) {
  fs.readdirSync(directory, (err, files) => {
    if (err) throw err;

    files.filter(file => file.match(regex))
      .forEach(file => fs.unlinkSync(path.join(directory, file), throwIfErr))
  });
}

function formatMarkdown(id, created_at, url, content) {
  return `---
title: ${id}
date: ${created_at}
src_url: ${url}
---

${content}\n`
}

function createFile(id, created_at, url, content) {
  const md = formatMarkdown(id, created_at, url, content)
  fs.writeFileSync(path.join(mastodon.folder, `${id}.html`), md)
}

axios.request(requestConfig).then(function (response) {
  cleanDir(mastodon.folder, /\.html$/)
  response.data.forEach(el => createFile(el.id, el.created_at, el.url, el.content))
})
