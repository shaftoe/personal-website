/**
 * Update content/mastodon folder with new Markdown files,
 * fetch content of latest 20 entries from Mastodon API
 */
const { getEnvOrFail, feedUpdatesToMarkdown } = require("./utils")

const target = {
    accountId: getEnvOrFail("YOUTUBE_CHANNEL"),
    baseUrl: "https://www.youtube.com/feeds/videos.xml",
    folder: "content/video",
}
target.url = `${target.baseUrl}?channel_id=${target.accountId}`

feedUpdatesToMarkdown(
    target,
    item => {
        return {
            content: "{{< media \"Watch this video on YouTube\" \"YouTube video thumbnail\" \"fab fa-youtube fa-4x\" >}}",
            date: item["published"],
            id: item["yt:videoId"],
            src_url: item["link"]["href"],
            thumbnail: item["media:group"]["media:thumbnail"]["url"],
            title: item["media:group"]["media:title"],
        }
    },
    true
)
