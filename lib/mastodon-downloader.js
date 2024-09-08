/**
 * Update content/mastodon folder with new Markdown files,
 * fetch content of latest entries from Mastodon API
 */
const { apiUpdatesToMarkdown, getEnvOrFail } = require("./utils")

const target = {
    accountId: getEnvOrFail("MASTODON_ACCOUNT_ID"),
    baseUrl: "https://fosstodon.org/",
    path: `api/v1/accounts/${getEnvOrFail("MASTODON_ACCOUNT_ID")}/statuses`,
    folder: "content/mastodon",
}

apiUpdatesToMarkdown(target, item => {
    return {
        content: item.content,
        date: item.created_at,
        id: item.id,
        src_url: item.url,
    }
})
