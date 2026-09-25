import { createRoot } from "react-dom/client"
import { RegistryContext } from "@effect/atom-react"
import { App } from "./App"
import { gameRegistry } from "./store"
import "./styles.css"

createRoot(document.getElementById("root")!).render(
  <RegistryContext.Provider value={gameRegistry}>
    <App />
  </RegistryContext.Provider>,
)
