import { defaultProps, Grommet } from "grommet";
import { render } from "preact";
import "webrtc-adapter"; // polyfilling webrtc
import App from "./App";
import "./assets/globals.css";

const theme = {
  global: {
    control: {
      border: {
        color: "brand",
        radius: "20px",
      },
    },
    font: {
      face: {
        fontFamily: "lucidatypewriter, monospace",
      },
      family: "Space Mono",
      size: "14px",
      height: "20px",
    },
    colors: {
      // neon lavender
      brand: "#4bffac",
      // neon green
      "accent-1": "#af79ff",
      ...defaultProps.theme.global?.colors,
    },
  },
};

render(
  <Grommet full={true} theme={theme} themeMode="dark">
    <App />
  </Grommet>,
  document.querySelector("#app") as HTMLElement,
);
