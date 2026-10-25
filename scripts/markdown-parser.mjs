import { Marked } from "marked";
import markedFootnote from "marked-footnote";

// The footnote extension stores document state, so each lex/parse operation gets
// its own parser. Security validation and HTML rendering use the same options.
export function createMarkdownParser(locale = "en") {
  const japanese = locale === "ja";
  return new Marked({ gfm: true, breaks: false }).use(
    markedFootnote({
      description: japanese ? "脚注" : "Footnotes",
      // The extension interpolates {0} without HTML-escaping the source label.
      backRefLabel: japanese ? "本文の参照に戻る" : "Back to reference"
    })
  );
}
