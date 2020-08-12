"use strict"

/* Many thanks to https://flaviocopes.com/canvas-node-generate-image/ for the idea */

const path = require("path")
const { createCanvas } = require("canvas")
const { writeFileSync, readdirSync } = require("fs")
const { getMatchFromTextFile } = require("./utils")

const titleRegExpMatch = /^title:\s+(.*)/

/* DEFAULT canvas values */
const
    width = 1200,
    height = 600,
    bkgColor = getSCSSVar(/\$color-bkg-dark:\s+(.*);/),
    blogTitleFont = "bold 70pt Roboto",
    blogTitleColor = getSCSSVar(/\$color-main:\s+(.*);/),
    articleTitleFont = "normal 56pt Roboto",
    articleTitleColor = getSCSSVar(/\$color-secondary:\s+(.*);/)

function getSCSSVar(regExp) {
    return getMatchFromTextFile("assets/scss/_variables.scss", regExp)
}

function is_text_length_valid(text, maxWidth, context) {
    const measure = context.measureText(text.join(" "))
    return measure.width < maxWidth
}

function fail(message) {
    console.log(`ERROR: ${message}`)
    process.exit(1)
}

function wrapText(string, maxWidth, context) {
    const result = [[]]
    let lastResultLine, testLine

    string.split(" ").forEach(word => {
        lastResultLine = result[result.length - 1]
        testLine = lastResultLine.concat(word)

        if (is_text_length_valid(testLine, maxWidth, context)) result[result.length - 1] = testLine
        else result.push([word])
    })

    return result
}

function createPNG(articlePath, blogTitle) {
    const canvas = createCanvas(width, height)
    const context = canvas.getContext("2d")
    const articleTitle = getMatchFromTextFile(path.join(articlePath, "index.md"), titleRegExpMatch)
    const blogTitleY = 140
    const leftPadding = 30
    const maxWidth = 1140
    const lineHeight = 40

    if (articleTitle == "") fail("article title not found, aborting")
    console.log(`Processing ${articlePath}`)

    context.fillStyle = bkgColor
    context.fillRect(0, 0, width, height)

    context.font = blogTitleFont
    context.fillStyle = blogTitleColor
    context.textAlign = "center"
    context.fillText(blogTitle, width / 2, blogTitleY)

    context.font = articleTitleFont
    context.fillStyle = articleTitleColor
    context.textAlign = "left"

    const wrapped = wrapText(articleTitle, maxWidth, context)
    let y = blogTitleY * 2

    switch (wrapped.length) {
    case 1:
    case 2:
        y += lineHeight * 2
        break
    case 3:
        y += lineHeight
        break;
    case 4:
        break
    default:
        fail("article title too long, please fix. Aborting")
    }

    wrapped.map(item => item.join(" ")).forEach(line => {
        context.fillText(line, leftPadding, y)
        y += context.measureText(line).actualBoundingBoxAscent * 1.5
    })

    const buffer = canvas.toBuffer("image/png")
    const pngPath = path.join(articlePath, "opengraph.png")
    console.log("Writing " + pngPath)
    writeFileSync(pngPath, buffer)
}

const blogTitle = getMatchFromTextFile("content/blog/_index.md", titleRegExpMatch)
readdirSync("content/blog", {withFileTypes: true})
    .filter(filePath => filePath.isDirectory())
    .forEach(articleDir => createPNG(path.join("content/blog", articleDir.name), blogTitle))
