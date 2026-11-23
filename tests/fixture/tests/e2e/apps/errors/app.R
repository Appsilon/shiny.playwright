library(shiny)

# Each button causes one kind of error the harness must report.
ui <- fluidPage(
  tags$button(id = "console_error", type = "button", onclick = "console.error('e2e-fixture: deliberate console error')",
              "Console error"),
  tags$button(id = "page_error", type = "button", onclick = "throw new Error('e2e-fixture: deliberate page error')",
              "Page error"),
  actionButton("output_error", "Output error"),
  actionButton("server_error", "Server error"),
  textOutput("result")
)

server <- function(input, output, session) {
  output$result <- renderText({
    if (input$output_error > 0) stop("e2e-fixture: deliberate output error")
    "No error yet"
  })
  observeEvent(input$server_error, stop("e2e-fixture: deliberate server error"))
}

shinyApp(ui, server)
