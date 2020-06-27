"use strict"

function setVisibilityAll(selector, visible = true, docRoot = document) {
    docRoot.querySelectorAll(selector).forEach(el => el.hidden = !visible)
}

function setDisplayAll(selector, visible = true, docRoot = document) {
    docRoot.querySelectorAll(selector).forEach(el => {
        el.style.display = visible ? "flex" : "none"
        el.hidden = !visible
    })
}

function hideSection(colNumber) {
    setVisibilityAll(`section.col_${colNumber}`, false)
}

function showSection(colNumber) {
    setVisibilityAll(`section.col_${colNumber}`, true)
}

function numberFromElementClassName(element, string) {
    let num
    element.classList.forEach(cls => {
        if (cls.match(`${string}_`)) num = cls.substr(4)
    })
    return num
}

function clickHandler(event) {
    event.stopPropagation()

    const selectedCol = numberFromElementClassName(event.srcElement, "col")
    const selectedRow = numberFromElementClassName(event.srcElement, "row")
    const unselectedCol = flipNumber(selectedCol)

    event.srcElement.classList.add("selected")
    document.querySelector(`nav.select-tab a.row_${selectedRow}.col_${unselectedCol}`)
        .classList.remove("selected")

    document.querySelector(`section.row_${selectedRow}.col_${selectedCol}`).hidden = false
    document.querySelector(`section.row_${selectedRow}.col_${unselectedCol}`).hidden = true
}

function addEventListeners() {
    document.querySelectorAll("nav.select-tab a").forEach(anchor =>
        anchor.addEventListener("click", clickHandler, false))
}

function removeEventListeners() {
    document.querySelectorAll("nav.select-tab a").forEach(anchor =>
        anchor.removeEventListener("click", clickHandler, false))
}

/**
 * Return 1 if number is 2, return 2 if number is 1
 * @param {integer} number
 */
function flipNumber(number) {
    if (number < 1 || number > 2)
        console.error("Wrong input: must be either 1 or 2, got", number)
    return (Number(number) % 2) + 1
}

function setSessionActive(columnNumber) {
    document.querySelectorAll(`nav.select-tab a.col_${columnNumber}`)
        .forEach(anchor => anchor.classList.add("selected"))
}

function unsetSessionActive(columnNumber) {
    document.querySelectorAll(`nav.select-tab a.col_${columnNumber}`)
        .forEach(anchor => anchor.classList.remove("selected"))
}

function handleMediaQueryEvent(event) {
    if (event.matches) {
        setDisplayAll(".large-only", false)
        setDisplayAll(".small-only", true)
        setSessionActive(1)
        unsetSessionActive(2)
        hideSection(2)
        addEventListeners()
    } else {
        setDisplayAll(".small-only", false)
        setDisplayAll(".large-only", true)
        showSection(1)
        showSection(2)
        unsetSessionActive(1)
        unsetSessionActive(2)
        removeEventListeners()
    }
}

/**
 * Get CSS --responsive-max-width variable defined in :root from latest inline CSS document
 */
function getMaxResponsiveWidth() {
    const len = document.styleSheets.length,
        sheet = document.styleSheets[len - 1]
    return sheet.rules[0].cssText.match(/--responsive-max-width: (\d+px)/).pop()
}

window.onload = () => {
    const mql = window.matchMedia(`screen and (max-width: ${getMaxResponsiveWidth()})`)
    handleMediaQueryEvent(mql)
    mql.addListener(handleMediaQueryEvent)
}