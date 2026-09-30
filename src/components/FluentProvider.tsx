"use client";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import React from "react";

export default function FluentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FluentProvider theme={webLightTheme}>
      {children}
    </FluentProvider>
  );
}
