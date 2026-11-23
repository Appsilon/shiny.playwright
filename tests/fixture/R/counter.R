#' A button whose input value is the number of times it was clicked.
#'
#' The value comes from a custom input binding (inst/www/counter.js) with its own input type, so the server sees it
#' as `input$<inputId>` and the browser stores it as `<inputId>:e2efixture.counter`.
counterInput <- function(inputId, label) {
  htmltools::tagList(
    htmltools::htmlDependency(
      name = "e2efixture-counter",
      version = "0.1.0",
      src = "www",
      package = "e2efixture",
      script = "counter.js"
    ),
    htmltools::tags$button(id = inputId, class = "e2efixture-counter btn btn-default", type = "button", label)
  )
}

.onLoad <- function(libname, pkgname) {
  shiny::registerInputHandler("e2efixture.counter", function(value, ...) as.integer(value), force = TRUE)
}
