'use strict'

const anchorGroups = [
        getAnchorsFromRowNumber(1),
        getAnchorsFromRowNumber(2),
    ],
    sectionsGroups = [
        getSectionsFromRowNumber(1),
        getSectionsFromRowNumber(2),
    ]

function getAnchorsFromRowNumber(rowNumber) {
    return document.querySelectorAll(`#row_${rowNumber} .select-tab > a`)
}

function getSectionsFromRowNumber(rowNumber) {
    return document.querySelectorAll(`#row_${rowNumber} section`)
}

window.onload = () => {
    /**
     * Hide second section for each row and elements meant for browsers
     * with disabled JS
     */
    sectionsGroups.forEach(sections => { if (sections[1]) sections[1].hidden = true })
    document.querySelectorAll('.noscript-only').forEach(element => element.hidden = true)

    /**
     * Add event listener for "click" event to every "tab' anchor
     * and remove href to avoid unwanted scrolling
     */
    anchorGroups.forEach((group, groupIndex) => {
        group.forEach((anchor, anchorIndex) => {
            anchor.removeAttribute("href"); // To avoid unnecessary scrolling

            anchor.addEventListener("click", event => {
                event.stopPropagation()

                // swap "selected" class
                event.srcElement.classList.add("selected")
                anchorGroups[groupIndex][(anchorIndex+1) % 2].classList.remove("selected")

                // swap section visibility
                sectionsGroups[groupIndex][(anchorIndex+1) % 2].hidden = true
                sectionsGroups[groupIndex][anchorIndex % 2].hidden = false

            }, false)
        })
    })
}