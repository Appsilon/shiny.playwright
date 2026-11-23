library(shiny)

# The failing output appears about 300 ms after the first idle, like an output that renderUI() creates in a later
# round of server work. expectNoErrors() must wait for it instead of checking right after goto().
ui <- fluidPage(uiOutput("container"))

server <- function(input, output, session) {
  show_late <- reactiveVal(FALSE)
  first_run <- TRUE
  observe({
    if (first_run) {
      first_run <<- FALSE
      invalidateLater(300)
    } else {
      show_late(TRUE)
    }
  })
  output$container <- renderUI(if (show_late()) textOutput("late"))
  output$late <- renderText(stop("e2e-fixture: deliberate late output error"))
}

shinyApp(ui, server)
