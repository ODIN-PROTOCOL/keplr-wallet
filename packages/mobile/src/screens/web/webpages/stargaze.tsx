import React, { FunctionComponent } from "react";
import { WebpageScreen } from "../components/webpage-screen";

export const StargazeWebpageScreen: FunctionComponent = () => {
  return (
    <WebpageScreen
      name="Stargaze"
      source={{ uri: "https://www.stargaze.zone/?wallet=keplr" }}
    />
  );
};
