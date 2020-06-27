'use strict'

function setVisibilityAll(selector, visible = true) {
    document.querySelectorAll(selector).forEach(el => el.hidden = !visible)
}

function hideSection(colNumber) {
    setVisibilityAll(`section.col_${colNumber}`, false)
}

function showSection(colNumber) {
    setVisibilityAll(`section.col_${colNumber}`, true)
}

function hideNavsAnchors() {
    setVisibilityAll("nav.select-tab a", false)
}

function showNavsAnchors() {
    setVisibilityAll("nav.select-tab a", true)
}

function columnFromElement(element) {
    let column
    element.classList.forEach(cls => {
        if (cls.match(/^col_/)) column = cls.substr(4)
    })
    return column
}

function rowFromElement(element) {
    let column
    element.classList.forEach(cls => {
        if (cls.match(/^row_/)) column = cls.substr(4)
    })
    return column
}

function clickHandler(event) {
    event.stopPropagation()

    const selectedCol = columnFromElement(event.srcElement)
    const selectedRow = rowFromElement(event.srcElement)
    const selectedSection = document.querySelector(`section.col_${selectedCol}.row_${selectedRow}`)

    // Set selected anchor and show selected section
    event.srcElement.classList.add("selected")
    selectedSection.hidden = false

    // Hide non-selected section
    document.querySelectorAll("nav.select-tab a").forEach(anchor => {
        if (anchor !== event.srcElement) anchor.classList.remove("selected")
    })
    document.querySelector(
        `section.row_${selectedRow}.col_${otherColumnNumber(selectedCol)}`)
        .hidden = true
}

/**
 * Add event listener for "click" event to every "tab" anchor
 * and remove href to avoid unwanted scrolling
 */
function addEventListeners() {
    document.querySelectorAll('nav.select-tab a').forEach(anchor =>
        anchor.addEventListener("click", clickHandler, false))
}

function removeEventListeners() {
    document.querySelectorAll('nav.select-tab a').forEach(anchor => {
        anchor.removeEventListener("click", clickHandler, false)
    })
}

function otherColumnNumber(columnNumber) {
    return (Number(columnNumber) % 2) + 1
}

function setActiveSection(columnNumber) {
    document.querySelectorAll(`nav.select-tab a.col_${columnNumber}`)
        .forEach(anchor => anchor.classList.add("selected"))
}

function unsetActiveSection(columnNumber) {
    document.querySelectorAll(`nav.select-tab a.col_${columnNumber}`)
        .forEach(anchor => anchor.classList.remove("selected"))
}

function hideLargeScreen() {
    setVisibilityAll('.large-only', false)
}

function showLargeScreen() {
    setVisibilityAll('.large-only', true)
}

function handleMediaQueryEvent(event) {
    if (event.matches) {
        addEventListeners()
        setActiveSection(1)
        unsetActiveSection(2)
        hideSection(2)
        hideLargeScreen()
        showNavsAnchors()
    } else {
        removeEventListeners()
        showSection(1)
        showSection(2)
        unsetActiveSection(1)
        unsetActiveSection(2)
        hideNavsAnchors()
        showLargeScreen()
    }
}

window.onload = () => {
    // JS is enabled so let's hide all the noscript-only elements
    // document.querySelectorAll('.noscript-only').forEach(element => element.hidden = true)

    const mql = window.matchMedia("screen and (max-width: 799px)") // FIXME fetch from CSS
    handleMediaQueryEvent(mql)
    mql.addListener(handleMediaQueryEvent)
}
