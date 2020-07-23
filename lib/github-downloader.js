/**
 * Update content/github folder with new Markdown files,
 * fetch content of latest events from GitHub API
 */
const { apiUpdatesToMarkdown, getEnvOrFail } = require("./utils")

const target = {
    accountId: getEnvOrFail("GITHUB_ACCOUNT_ID"),
    baseUrl: "https://api.github.com/",
    folder: "content/github",
    headers: {
        "Accept": "application/vnd.github.v3+json",
    },
    fileExtension: "md",
}
target.url = `users/${target.accountId}/events/public`

apiUpdatesToMarkdown(target, item => {
    let output = {
        author: item.actor.display_login,
        date: item.created_at,
        id: item.id,
        repo: item.repo.name,
        type: item.type,
    }

    switch (item.type) {

    case "IssueCommentEvent":
        output.action = item.payload.action
        output.src_url = item.payload.issue.html_url
        output.content = `[Comment added](${output.src_url}) to _${output.repo}_`
        break;

    case "PullRequestEvent":
        output.action = item.payload.action
        output.src_url = item.payload.pull_request.html_url
        output.content = `[Pull request](${output.src_url}) for _${output.repo}_ ${output.action}`
        break;

    case "ForkEvent":
        output.src_url = item.payload.forkee.html_url
        output.content = `Forked [${output.repo}](${output.src_url})`
        break;

    case "WatchEvent":
        output.action = item.payload.action
        output.content = `Started to watch [${output.repo}](https://github.com/${output.repo})`
        break;

    case "CreateEvent":
    case "DeleteEvent":
    case "PushEvent":
        output.ref = item.payload.ref
        break;
    }

    if (!output.src_url) output.src_url = `https://github.com/${output.repo}`
    if (!output.content) output.content = `${output.type} on [${output.repo}](https://github.com/${output.repo})`

    return output
})
