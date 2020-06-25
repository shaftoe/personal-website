'use strict'

function getAnchorsFromRowNumber(rowNumber) {
    return document.querySelectorAll(`#row_${rowNumber} .select-tab > a`)
}

function selected(elements) {
    for (let element of elements) {
        if (element.classList.contains('selected')) return element
    }
}

const anchorGroups = [
    getAnchorsFromRowNumber(1),
    getAnchorsFromRowNumber(2),
]

function isSelected(element) {
    return element.classList.contains('selected')
}

function selectClick(event, anchorIndex, groupIndex) {
    // swap "selected" class
    event.srcElement.classList.add("selected")
    anchorGroups[groupIndex][anchorIndex % 2].classList.remove("selected")

    // swap section visibility
}


/**
 * Add event listener for "click" event to every "tab' anchor
 */
anchorGroups.forEach((group, groupIndex) => {
    group.forEach((anchor, anchorIndex) => {
        anchor.addEventListener("click", (event) => { selectClick(event, anchorIndex+1, groupIndex) }, false)
    })
})
