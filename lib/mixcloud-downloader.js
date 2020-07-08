/**
 * Update content/music folder with new Markdown files,
 * fetch content of latest 20 entries from Mixcloud API
 */
const { apiUpdatesToMarkdown, getEnvOrFail } = require("./utils")

const target = {
    accountId: getEnvOrFail("MIXCLOUD_ACCOUNT_ID"),
    baseUrl: "https://api.mixcloud.com/",
    folder: "content/music",
}
target.url = `${target.accountId}/cloudcasts/`

apiUpdatesToMarkdown(
    target,
    item => {
        return {
            date: item.created_time,
            src_url: item.url,
            genres: "[ " + item.tags.map(tag => `"${tag.name}"`).join(", ") + " ]",
            title: item.name,
            content: "{{< mixcloud >}}",
            thumbnail: item.pictures["640wx640h"],
        }
    },
    "data",
    true
)
