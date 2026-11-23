library(shiny)
library(e2efixture)

ui <- fluidPage(
  counterInput("clicks", "Click me"),
  textOutput("clicks_text"),
  selectInput("letter", "Letter", choices = c("a", "b", "c")),
  textOutput("letter_text"),
  textOutput("slow_text")
)

server <- function(input, output, session) {
  output$clicks_text <- renderText(paste("Clicks:", input$clicks))
  output$letter_text <- renderText(paste("Letter:", input$letter))
  # Slow first render: goto() must not return before it is on the page.
  output$slow_text <- renderText({
    Sys.sleep(1)
    "Slow output ready"
  })
}

shinyApp(ui, server)
