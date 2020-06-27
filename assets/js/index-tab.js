'use strict'

function setVisibilityAll(selector, visible = true, docRoot = document) {
    docRoot.querySelectorAll(selector).forEach(el => el.hidden = !visible)
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

function numberFromElementClassName(element, string) {
    let num
    element.classList.forEach(cls => {
        if (cls.match(`${string}_`)) num = cls.substr(4)
    })
    return num
}

function clickHandler(event) {
    event.stopPropagation()

    const selectedCol = numberFromElementClassName(event.srcElement, 'col')
    const selectedRow = numberFromElementClassName(event.srcElement, 'row')
    const unselectedRow = otherColumnNumber(selectedCol)

    // Set selected anchor and show selected section
    event.srcElement.classList.add("selected")
    document.querySelector(`section.col_${selectedCol}.row_${selectedRow}`).hidden = false

    // Hide non-selected section
    document.querySelector(`a.row_${selectedRow}.col_${unselectedRow}`).classList.remove("selected")
    document.querySelector(`section.row_${selectedRow}.col_${unselectedRow}`).hidden = true
}

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
        addEventListeners()
        setSessionActive(1)
        unsetSessionActive(2)
        hideSection(2)
        setVisibilityAll('.large-only', false)
        setVisibilityAll('.small-only', true)
    } else {
        removeEventListeners()
        showSection(1)
        showSection(2)
        unsetSessionActive(1)
        unsetSessionActive(2)
        setVisibilityAll('.large-only', true)
        setVisibilityAll('.small-only', false)
    }
}

window.onload = () => {
    const mql = window.matchMedia("screen and (max-width: 799px)") // FIXME fetch from CSS
    handleMediaQueryEvent(mql)
    mql.addListener(handleMediaQueryEvent)
}

function getStyleSheet(unique_title) {
  for (var i=0; i<document.styleSheets.length; i++) {
    var sheet = document.styleSheets[i];
    if (sheet.title == unique_title) {
      return sheet;
    }
  }
}
