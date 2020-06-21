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
  }
}