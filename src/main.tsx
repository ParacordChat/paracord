import { Grommet } from "grommet";
import { render } from "preact";
import App from "./App";
import "./assets/globals.css";

const theme = {
  //TODO: move to consts
  global: {
    font: {
      family: "Space Mono",
      size: "14px",
      height: "20px",
    },
    colors: {
      //neon lavender
      brand: "#BFA5FF",
      //neon green
      brandSecondary: "#00FFA3",
    },
  },
};

render(
  <Grommet theme={theme}>
    <App />
  </Grommet>,
  document.getElementById("app") as HTMLElement
);
