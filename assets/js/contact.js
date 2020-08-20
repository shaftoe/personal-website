"use strict"

const form = document.forms[0]
const button = form.querySelector("button.send")
const description = form.querySelector("#textAreaMessage")
const email = form.querySelector("#inputEmail")
const fieldset = form.querySelector("fieldset")
const inputName = form.querySelector("#inputName")

fieldset.disabled = false

function getData() {
    return {
        description: description.value,
        email: email.value,
        name: inputName.value || "<No name>",
        source: window.location.href,
    }
}

form.addEventListener("submit", event => {
    event.preventDefault()
    fieldset.disabled = true
    button.innerText = "Sending..."
    axios.post("https://api.l3x.in/contact", getData()) // eslint-disable-line no-undef
        .then(() => window.location.href = "/message-received")
        .catch(error => {
            const errorMessageDiv = document.createElement("div")
            const errorMessageHead = document.createElement("p")
            const errorMessageErr = document.createElement("p")
            button.innerText = "Error - Refresh this page and try again"
            errorMessageDiv.className = "error"
            errorMessageHead.innerText = "Some error occurred! Please try again later"
            errorMessageErr.innerText = error
            errorMessageDiv.appendChild(errorMessageHead)
            errorMessageDiv.appendChild(errorMessageErr)
            form.appendChild(errorMessageDiv)
        })
})
