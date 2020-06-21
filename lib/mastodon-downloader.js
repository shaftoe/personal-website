const { downloadUpdatesToMarkdown } = require('./utils')

const target = {
  accountId: process.env.MASTODON_ACCOUNT_ID,
  apiBaseUrl: 'https://fosstodon.org/api/v1/',
  folder: 'content/mastodon'
}
target.url = `accounts/${target.accountId}/statuses`

downloadUpdatesToMarkdown(target, item => {
  return {
    title: item.id,
    date: item.created_at,
    src_url: item.url,
    content: item.content,
  }
})
