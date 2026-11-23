library(shiny)

# No outputs and no observers: the server never reports busy or idle, so goto() relies on its quiet window.
shinyApp(fluidPage(h1("Static page")), function(input, output, session) {})
