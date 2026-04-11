import { siteConfig } from "../config"

function showError(
  errorDiv: HTMLDivElement,
  successDiv: HTMLDivElement,
  message: string,
  detail: string,
): void {
  successDiv.setAttribute("hidden", "")
  successDiv.replaceChildren()

  errorDiv.replaceChildren()
  const p1 = document.createElement("p")
  const p2 = document.createElement("p")
  p1.className = "font-medium"
  p1.textContent = message
  p2.textContent = detail
  errorDiv.appendChild(p1)
  errorDiv.appendChild(p2)
  errorDiv.removeAttribute("hidden")
}

function initContactForm(): void {
  const contactEndpoint = siteConfig.contact.apiUrl

  const form = document.querySelector("form")
  const successDiv = document.getElementById("success")
  const errorDiv = document.getElementById("error")

  if (
    !(form instanceof HTMLFormElement) ||
    !(successDiv instanceof HTMLDivElement) ||
    !(errorDiv instanceof HTMLDivElement)
  ) {
    return
  }

  const button = form.querySelector("button[type='submit']")
  const fieldset = form.querySelector("fieldset")

  if (
    !(button instanceof HTMLButtonElement) ||
    !(fieldset instanceof HTMLFieldSetElement)
  ) {
    return
  }

  // Enable the form once JS is loaded
  fieldset.disabled = false

  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault()
    fieldset.disabled = true
    button.textContent = "Sending..."

    const email = (form.elements.namedItem("email") as HTMLInputElement).value
    const name = (form.elements.namedItem("name") as HTMLInputElement).value
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)
      .value

    const body: {
      description: string
      email: string
      name: string
      source: string
    } = {
      description: message,
      email,
      name: name || "<No name>",
      source: window.location.href,
    }

    fetch(contactEndpoint, {
      method: "POST",
      body: JSON.stringify(body),
    })
      .then((response: Response) => {
        if (!response.ok) {
          return response.text().then((text: string) => {
            showError(
              errorDiv,
              successDiv,
              "Some error occurred! Please try again later.",
              text,
            )
            fieldset.disabled = false
            button.textContent = "Send message"
          })
        }

        errorDiv.setAttribute("hidden", "")
        errorDiv.replaceChildren()
        successDiv.replaceChildren()

        const p = document.createElement("p")
        p.className = "text-lg font-medium"
        p.textContent = "Thank you for your message, I'll get back to you soon"
        successDiv.appendChild(p)
        successDiv.removeAttribute("hidden")
        form.replaceChildren()
        form.classList.add("hidden")
      })
      .catch((error: unknown) => {
        showError(
          errorDiv,
          successDiv,
          "Some error occurred! Please try again later.",
          String(error),
        )
        fieldset.disabled = false
        button.textContent = "Send message"
      })
  })
}

initContactForm()
