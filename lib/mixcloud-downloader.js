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
            genres: "[ " + item.tags.map(tag => `"${tag.name}"`).join(", ") + " ]",
            title: item.name,
            content: `{{< mixcloud "${item.key}" >}}`,
        }
    },
    "data",
)
