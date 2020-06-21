/**
 * Update content/mastodon folder with new Markdown files,
 * fetch content of latest 20 entries from Mastodon API
 */
const { downloadUpdatesToMarkdown, getEnvOrFail } = require('./utils')

const target = {
  accountId: getEnvOrFail('MASTODON_ACCOUNT_ID'),
  apiBaseUrl: 'https://fosstodon.org/api/v1/',
  folder: 'content/mastodon'
}
target.url = `accounts/${target.accountId}/statuses`

downloadUpdatesToMarkdown(target, item => {
  return {
    content: item.content,
    date: item.created_at,
    src_url: item.url,
    title: item.id,
  }
})
