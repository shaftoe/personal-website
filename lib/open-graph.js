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

function fillWrappedText(context, text, x, y, maxWidth, lineHeight) {
    let line = ""
    let testLine, testWidth

    text.split(" ").forEach(word => {
        testLine = line + word + " "
        testWidth = context.measureText(testLine).width
        if (testWidth > maxWidth) {
            context.fillText(line, x, y)
            line = word + " "
            y += lineHeight
        }
        else {
            line = testLine
        }
    })
    context.fillText(line, x, y);
}

function createPNG(articlePath, blogTitle) {
    const
        canvas = createCanvas(width, height),
        context = canvas.getContext("2d"),
        articleTitle = getMatchFromTextFile(path.join(articlePath, "index.md"), titleRegExpMatch)

    if (articleTitle == "") {
        console.log("ERROR: article title not found, aborting")
        process.exit(1)
    }

    context.fillStyle = bkgColor
    context.fillRect(0, 0, width, height)

    context.font = blogTitleFont
    context.fillStyle = blogTitleColor
    context.textAlign = "center"
    context.fillText(blogTitle, 600, 170)

    context.font = articleTitleFont
    context.fillStyle = articleTitleColor
    context.textAlign = "left"
    fillWrappedText(context, articleTitle, 60, 350, 1140, 70)

    const buffer = canvas.toBuffer("image/png")
    const pngPath = path.join(articlePath, "opengraph.png")
    console.log("Writing " + pngPath)
    writeFileSync(pngPath, buffer)
}

const blogTitle = getMatchFromTextFile("content/blog/_index.md", titleRegExpMatch)
readdirSync("content/blog", {withFileTypes: true})
    .filter(filePath => filePath.isDirectory())
    .forEach(articleDir => createPNG(path.join("content/blog", articleDir.name), blogTitle))
