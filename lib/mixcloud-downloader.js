/**
 * Update content/music folder with new Markdown files,
 * fetch content of latest 20 entries from Mixcloud API
 */
const { downloadUpdatesToMarkdown, getEnvOrFail } = require("./utils")

const target = {
    accountId: getEnvOrFail("MIXCLOUD_ACCOUNT_ID"),
    apiBaseUrl: "https://api.mixcloud.com/",
    folder: "content/music",
}
target.url = `${target.accountId}/cloudcasts/`

downloadUpdatesToMarkdown(
    target,
    item => {
        return {
            date: item.created_time,
            play_count: item.play_count,
            src_url: item.url,
            tags: item.tags.map(tag => tag.name),
            title: item.name,
            content: `<iframe width="100" height="60" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=${item.key}"></iframe>`
        }
    },
    "data",
)
