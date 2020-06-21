const axios = require('axios');
const fs = require('fs');
const path = require('path');

function cleanDir(directory, regex=/.+/) {
  fs.readdirSync(directory)
  .filter(file => file.match(regex))
  .forEach(file => {
    const _file = path.join(directory, file)
    console.debug(`Deleting ${_file}`)
    fs.unlinkSync(_file)
  })
}

function formatMarkdown(data) {
  let out = '---\n'
  Object.keys(data)
    .filter(key => key !== 'content')
    .forEach(key => out += `${key}: ${data[key]}\n`)
  out += '---\n\n'

  if (data.content) out += data.content + '\n'

  return out
}

function createMdFile(name, folder, content) {
  const file = path.join(folder, name)
  console.debug(`Writing ${file}`)
  fs.writeFileSync(file, content)
}

module.exports = {

  downloadUpdatesToMarkdown: function (target, mapping, responseKey) {
    let count = 1
    const requestConfig = {
      url: target.url,
      baseURL: target.apiBaseUrl,
    }

    axios.request(requestConfig).then(function (response) {
      let _data = responseKey ? response.data[responseKey] : response.data

      cleanDir(target.folder, /\.html$/)

      _data.forEach(item => {
        createMdFile(
          `${count}.html`,
          target.folder,
          formatMarkdown(mapping(item)),
        )
        count += 1
      })
    })
  },

}
