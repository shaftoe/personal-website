"use strict"

const token = "###TOKEN###"

const submit = (fieldset, button, getURL, getData) => {
    return (event) => {
        event.preventDefault()
        fieldset.disabled = true
        button.innerText = "Sending..."
        axios.post(getURL(), getData())
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
    }
}
