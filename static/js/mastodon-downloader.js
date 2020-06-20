const axios = require('axios');

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

axios.request(requestConfig)
  .then(function (response) {
      response.data.forEach(el => {
          console.log(`---\ntitle: ${el.id}\ndate: ${el.created_at}\nsrc_url: ${el.url}\n---\n\n${el.content}\n`)
      });
  })
  .catch(function (error) {
    console.log(error);
  })
  .finally(function () {
    // always executed
  });
