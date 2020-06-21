const axios = require('axios');
const { cleanDir, formatMarkdown, createMdFile } = require('./utils')

const target = {
  accountId: process.env.MIXCLOUD_ACCOUNT_ID,
  apiBaseUrl: 'https://api.mixcloud.com/',
  folder: 'content/music',
}
target.url = `${target.accountId}/cloudcasts/`

const requestConfig = {
  url: target.url,
  baseURL: target.apiBaseUrl,
}

axios.request(requestConfig).then(function (response) {
  cleanDir(target.folder, /\.html$/)
  response.data.data.forEach(item => createMdFile(
    `${item.slug}.html`,
    target.folder,
    formatMarkdown({
      date: item.created_time,
      src_url: item.url,
      title: item.name,
      play_count: item.play_count,
      tags: item.tags.map(tag => tag.name),
    })
  ))
})
