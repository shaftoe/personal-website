const fs = require("fs");
const path = require("path");

function cleanContentDir(directory, regex = /.+/) {
    fs.readdirSync(directory, { withFileTypes: true })
        .filter(item => item.name.match(regex))
        .forEach(item => {
            const _path = path.join(directory, item.name)
            console.debug(`Deleting ${_path}`)
            fs.rmdirSync(_path, { recursive: true })
        })
}

function formatMarkdown(data) {
    let out = "---\n"
    Object.keys(data)
        .filter(key => key !== "content")
        .forEach(key => {
            if (key === "title") out += `${key}: "${data[key]}"\n`
            else out += `${key}: ${data[key]}\n`
        })
    out += "---\n\n"

    if (data.content) out += data.content + "\n"

    return out
}

function createFile(name, folder, content) {
    const file = path.join(folder, name)
    console.debug(`Writing ${file}`)
    fs.writeFileSync(file, content)
}

function itemsToMarkdown(folder, items, mapping, downloadThumbnail) {
    let count = 0

    items.forEach(item => {
        count += 1
        const _folder = path.join(
            folder,
            `item_${(count).toLocaleString(undefined, { minimumIntegerDigits: 2 })}`)
        fs.mkdirSync(_folder)

        createFile(
            "index.html",
            _folder,
            formatMarkdown(mapping(item)),
        )

        if (downloadThumbnail) {
            const axios = require("axios")
            const thumbUrl = mapping(item).thumbnail
            const writer = fs.createWriteStream(path.join(_folder, "thumbnail.jpg"))

            console.log(`Download thumbnail ${thumbUrl}`)
            axios.get(thumbUrl, { responseType: "stream" })
                .then(function (response) {
                    response.data.pipe(writer)
                })
        }
    })
}

function request(target, responseKey) {
    const axios = require("axios")
    const requestConfig = {
        url: target.url,
        baseURL: target.baseUrl,
    }

    return axios.request(requestConfig).then(function (response) {
        return responseKey ? response.data[responseKey] : response.data
    })
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
     * @param {boolean} downloadThumbnail - if set to true download the thumbnail image using
     *                                      `thumbnail` key from mapping
     */
    apiUpdatesToMarkdown: function (target, mapping, responseKey, downloadThumbnail) {
        request(target, responseKey).then(function (items) {
            cleanContentDir(target.folder, /^item/)
            itemsToMarkdown(target.folder, items, mapping, downloadThumbnail)
        })
    },

    /**
     * Fetch updates from target RSS feed, generate (and replace) Markdown files with defined
     * `mapping` keys in front matter (mapped `content` key goes into the Markdown body)
     * @param {object} target - target object
     * @param {function} mapping - function to map axios data results to
     *                             Markdown front matter keys
     * @param {boolean} downloadThumbnail - if set to true download the thumbnail image using
     *                                      `thumbnail` key from mapping
     */
    feedUpdatesToMarkdown: function (target, mapping, downloadThumbnail) {
        request(target).then(xml => {
            const parser = require("fast-xml-parser")
            const jsonObj = parser.parse(xml, { "ignoreAttributes": false, "attributeNamePrefix": "" })
            const items = jsonObj.feed.entry
            cleanContentDir(target.folder, /^item/)
            itemsToMarkdown(target.folder, items, mapping, downloadThumbnail)
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
