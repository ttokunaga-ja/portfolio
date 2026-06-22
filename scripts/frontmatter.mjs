function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }

  return trimmed;
}

function indentation(line) {
  return line.match(/^ */)?.[0].length ?? 0;
}

function parseIndentedObject(lines, startIndex, indent) {
  const object = {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const currentIndent = indentation(line);
    if (currentIndent < indent) break;
    if (currentIndent > indent) {
      throw new Error(`Unsupported frontmatter indentation: ${line}`);
    }

    const match = line.slice(indent).match(/^([^:]+):(.*)$/);
    if (!match) {
      throw new Error(`Unsupported frontmatter line: ${line}`);
    }

    const [, rawKey, rawValue] = match;
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (value) {
      object[key] = parseScalar(value);
      index += 1;
      continue;
    }

    const nextLine = lines[index + 1];
    if (!nextLine || indentation(nextLine) <= indent) {
      object[key] = "";
      index += 1;
      continue;
    }

    const nextIndent = indentation(nextLine);
    if (nextLine.slice(nextIndent).startsWith("- ")) {
      const array = [];
      index += 1;
      while (index < lines.length) {
        const itemLine = lines[index];
        if (!itemLine.trim()) {
          index += 1;
          continue;
        }
        if (indentation(itemLine) !== nextIndent || !itemLine.slice(nextIndent).startsWith("- ")) break;
        array.push(parseScalar(itemLine.slice(nextIndent + 2)));
        index += 1;
      }
      object[key] = array;
      continue;
    }

    const parsed = parseIndentedObject(lines, index + 1, nextIndent);
    object[key] = parsed.data;
    index = parsed.index;
  }

  return { data: object, index };
}

export function parseFrontmatter(raw) {
  const normalized = raw.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { data: {}, content: normalized };
  }

  const lines = match[1].split(/\r?\n/);
  return {
    data: parseIndentedObject(lines, 0, 0).data,
    content: normalized.slice(match[0].length)
  };
}
