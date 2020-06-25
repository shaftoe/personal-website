'use strict'

const anchorGroups = [
    getAnchorsFromRowNumber(1),
    getAnchorsFromRowNumber(2),
]
const sectionsGroups = [
    getSectionsFromRowNumber(1),
    getSectionsFromRowNumber(2),
]

function getAnchorsFromRowNumber(rowNumber) {
    return document.querySelectorAll(`#row_${rowNumber} .select-tab > a`)
}

function getSectionsFromRowNumber(rowNumber) {
    return document.querySelectorAll(`#row_${rowNumber} section`)
}

function selected(elements) {
    for (let element of elements) {
        if (element.classList.contains('selected')) return element
    }
}

function isSelected(element) {
    return element.classList.contains('selected')
}

function selectClick(event, anchorIndex, groupIndex) {
    // swap "selected" class
    event.srcElement.classList.add("selected")
    anchorGroups[groupIndex][(anchorIndex+1) % 2].classList.remove("selected")

    // swap section visibility
    sectionsGroups[groupIndex][(anchorIndex+1)%2].hidden = true
    sectionsGroups[groupIndex][anchorIndex%2].hidden = false
}


/**
 * Add event listener for "click" event to every "tab' anchor
 * and remove href to avoid unwanted scrolling
 */
anchorGroups.forEach((group, groupIndex) => {
    group.forEach((anchor, anchorIndex) => {
        anchor.removeAttribute("href");
        anchor.addEventListener("click", (event) => { selectClick(event, anchorIndex, groupIndex) }, false)
    })
})

/**
 * Hide second section when loaded
 */
sectionsGroups.forEach(sections => { if (sections[1]) sections[1].hidden = true })
