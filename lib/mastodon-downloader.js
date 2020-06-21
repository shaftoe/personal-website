const axios = require('axios');
const { cleanDir, formatMarkdown, createMdFile } = require('./utils')

const target = {
  accountId: process.env.MASTODON_ACCOUNT_ID,
  apiBaseUrl: 'https://fosstodon.org/api/v1/',
  folder: 'content/mastodon'
}
target.url = `accounts/${target.accountId}/statuses`

const requestConfig = {
  url: target.url,
  baseURL: target.apiBaseUrl,
}

axios.request(requestConfig).then(function (response) {
  cleanDir(target.folder, /\.html$/)
  response.data.forEach(item => createMdFile(
    `${item.id}.html`,
    target.folder,
    formatMarkdown({
      title: item.id,
      date: item.created_at,
      src_url: item.url,
      content: item.content,
    })
  ))
})
