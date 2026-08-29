import React from "react";
import { defaultLocale } from "./i18n";
import type { Locale } from "./types";

export const LocaleContext = React.createContext<Locale>(defaultLocale);
