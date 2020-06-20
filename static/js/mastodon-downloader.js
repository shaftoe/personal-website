const axios = require('axios');
const fs = require('fs');

const mastodon = {
    accountId: 36187,
    apiBaseUrl: 'https://fosstodon.org/api/v1/',
}
mastodon.url = `accounts/${mastodon.accountId}/statuses`

const requestConfig = {
    url: mastodon.url,
    baseURL: mastodon.apiBaseUrl,
    transformResponse: [function (data) {
        // filter out unneeded fields
        return JSON.parse(data).map(({ id, url, content, created_at }) => {
            return {
                id: id, url: url, content: content, created_at: created_at,
            }
        })
    }],
}

function formatMarkdown(id, created_at, url, content) {
    return `---
title: ${id}
date: ${created_at}
src_url: ${url}
---

${content}\n`
}

function createFile(id, created_at, url, content) {
    const md = formatMarkdown(id, created_at, url, content)
    fs.writeFileSync(`content/microblog/${id}.html`, md)
}

axios.request(requestConfig)
  .then(function (response) {
      response.data.forEach(el => {
          createFile(el.id, el.created_at, el.url, el.content)
      })
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
