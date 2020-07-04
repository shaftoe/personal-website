const axios = require("axios");
const fs = require("fs");
const path = require("path");

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
    let out = "---\n"
    Object.keys(data)
        .filter(key => key !== "content")
        .forEach(key => out += `${key}: ${data[key]}\n`)
    out += "---\n\n"

    if (data.content) out += data.content + "\n"

    return out
}

function createMdFile(name, folder, content) {
    const file = path.join(folder, name)
    console.debug(`Writing ${file}`)
    fs.writeFileSync(file, content)
}

module.exports = {

    /**
   * Fetch updates from target API, generate (and replace) Markdown files with defined
   * `mapping` keys in front matter (mapped `content` key goes into the Markdown body)
   * @param {object} target - target object
   * @param {function} mapping - function to map axios data results to
   *                             Markdown front matter keys
   * @param {string} responseKey - if given, use response.data[responseKey] as data
   *                               instead of response.data
   */
    downloadUpdatesToMarkdown: function (target, mapping, responseKey) {
        let count = 1
        const requestConfig = {
            url: target.url,
            baseURL: target.apiBaseUrl,
        }

        axios.request(requestConfig).then(function (response) {
            let data = responseKey ? response.data[responseKey] : response.data

            cleanDir(target.folder, /\.html$/)

            data.forEach(item => {
                createMdFile(
                    `item_${count}.html`,
                    target.folder,
                    formatMarkdown(mapping(item)),
                )
                count += 1
            })
        })
    },

    /**
   * Return process.env[varName], exit with status 1 if not found
   * @param {string} varName - environment variable name
   */
    getEnvOrFail: function (varName) {
        if (! (varName in process.env)) {
            console.error(`Missing ${varName} env variable`)
            process.exit(1)
        }
        return process.env[varName]
    },
}
