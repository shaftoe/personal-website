/**
 * Update content/music folder with new Markdown files,
 * fetch content of latest entries from Mixcloud API
 */
const { apiUpdatesToMarkdown, getEnvOrFail } = require("./utils")

const target = {
    accountId: getEnvOrFail("MIXCLOUD_ACCOUNT_ID"),
    baseUrl: "https://api.mixcloud.com/",
    folder: "content/music",
    path: `${getEnvOrFail("MIXCLOUD_ACCOUNT_ID")}/cloudcasts/`,
}

apiUpdatesToMarkdown(
    target,
    item => {
        return {
            content: "{{< media \"Listen this music mix on Mixcloud\" \"Mixcloud music mix thumbnail\" \"fas fa-play-circle fa-4x\" >}}",
            date: item.created_time,
            genres: "[ " + item.tags.map(tag => `"${tag.name}"`).join(", ") + " ]",
            src_url: item.url,
            thumbnail: item.pictures["640wx640h"],
            title: item.name,
        }
    },
    "data",
    true
)
