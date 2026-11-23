library(shiny)
library(e2efixture)

ui <- fluidPage(
  h1("Hello e2efixture"),
  counterInput("clicks", "Click me"),
  textOutput("clicks_text")
)

server <- function(input, output, session) {
  output$clicks_text <- renderText(paste("Clicks:", input$clicks))
}

shinyApp(ui, server)
