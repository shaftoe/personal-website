/**
 * Update content/mastodon folder with new Markdown files,
 * fetch content of latest entries from Mastodon API
 */
const { apiUpdatesToMarkdown, getEnvOrFail } = require("./utils")

const target = {
    accountId: getEnvOrFail("MASTODON_ACCOUNT_ID"),
    baseUrl: "https://fosstodon.org/api/v1/",
    folder: "content/mastodon"
}
target.url = `accounts/${target.accountId}/statuses`

apiUpdatesToMarkdown(target, item => {
    return {
        content: item.content,
        date: item.created_at,
        src_url: item.url,
        id: item.id,
    }
})
