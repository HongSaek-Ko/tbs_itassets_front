import { ThemeProvider } from "styled-components";
import AppRouter from "./routes";
import { createTheme, CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: { mode: "light" },
});
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
