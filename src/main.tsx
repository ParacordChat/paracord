import { Grommet } from "grommet";
import { render } from "preact";
import App from "./App";
import "./assets/globals.css";

// const theme = {
//   global: {
//     font: {
//       family: "Space Mono",
//       size: "14px",
//       height: "20px",
//     },
//     colors: {
//       //neon lavender
//       brand: "#4bffac",
//       //neon green
//       "accent-1": "#af79ff",
//       ...defaultProps.theme.global?.colors,
//     },
//   }, theme={theme}
// };

render(
  <Grommet>
    <App />
  </Grommet>,
  document.getElementById("app") as HTMLElement
);
