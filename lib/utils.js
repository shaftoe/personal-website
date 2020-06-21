const fs = require('fs');
const path = require('path');

module.exports = {
  cleanDir: function (directory, regex=/.+/) {
    fs.readdirSync(directory)
    .filter(file => file.match(regex))
    .forEach(file => {
      const _file = path.join(directory, file)
      console.debug(`Deleting ${_file}`)
      fs.unlinkSync(_file)
    })
  },

  formatMarkdown: function (data) {
    let out = '---\n'
    Object.keys(data)
      .filter(key => key !== 'content')
      .forEach(key => out += `${key}: ${data[key]}\n`)
    out += '---\n\n'

    if (data.content) out += data.content + '\n'

    return out
  },

  createMdFile: function (name, folder, content) {
    const file = path.join(folder, name)
    console.debug(`Writing ${file}`)
    fs.writeFileSync(file, content)
  },
}
