const { downloadUpdatesToMarkdown } = require('./utils')

const target = {
  accountId: process.env.MIXCLOUD_ACCOUNT_ID,
  apiBaseUrl: 'https://api.mixcloud.com/',
  folder: 'content/music',
}
target.url = `${target.accountId}/cloudcasts/`

downloadUpdatesToMarkdown(
  target,
  item => {
    return {
      date: item.created_time,
      src_url: item.url,
      title: item.name,
      play_count: item.play_count,
      tags: item.tags.map(tag => tag.name),
    }
  },
  'data',
)
