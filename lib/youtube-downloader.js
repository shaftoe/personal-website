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

feedUpdatesToMarkdown(target, item => {
    const thumb = item["media:group"]["media:thumbnail"]["url"]
    const id = item["yt:videoId"]

    return {
        id: id,
        date: item["published"],
        src_url: item["link"]["href"],
        title: item["media:group"]["media:title"],
        content: `{{< youtube "${id}" "${thumb}" >}}`
    }
})