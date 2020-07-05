"use strict"

const scrollToTop = document.querySelector(".scroll_to_top");
scrollToTop.style.display = "none"

function scrollFunction() {
    if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
        scrollToTop.style.display = "block"
    } else {
        scrollToTop.style.display = "none"
    }
}

// When the user scrolls down 20px from the top of the document, show the scroll link
window.onscroll = function() {scrollFunction()};
