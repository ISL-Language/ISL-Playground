/*
Very basic syntax highlighting for ISL. Barely supports custom keywords, and sometimes ignores errors.
But it works.
 */

//constants
const keywords = [
  //Deprecated
  "declare",
  "var",
  "cmd",
  "webprompt",
  "flush",
  //vars
  "string",
  "number",
  "boolean",
  "object",
  "group",
  //functions
  "function",
  "end",
  "execute",
  //classes
  "class",
  "#",
  "create",
  //flow control
  "if",
  "else",
  "|",
  "jump",
  "stop",
  "rundelay",
  "restart",
  "iterate",
  //IO
  "awaitkey",
  "getkeys",
  "popup-input",
  "log",
  "warn",
  "error",
  //operators
  "add",
  "subtract",
  "multiply",
  "divide",
  "exponent",
  "root",
  "negate",
  "round",
  //other manipulation
  "set",
  "delete",
  "import",
  "export",
  //uhhh
  "as",
  "to",
  "on",
  "with",
  "=",
  "type",
];
const customKeywords = [];
const labels = ["non-destructive", "separated", "grouped", "temporary"];
const customLabels = [];
const operators = ["=", "<", ">", "!=", "in", "!in"];
const variableManipulators = [
  "var",
  "add",
  "subtract",
  "multiply",
  "divide",
  "exponent",
  "root",
  "negate",
  "round",
  "string",
  "number",
  "boolean",
  "object",
  "set",
  "delete",
  "as",
  "to",
  "on",
  "group",
  "#",
  "create",
];
const multiModeManipulators = ["getkeys", "awaitkey", "popup-input", "|"];
const functionManipulators = ["cmd", "function", "end", "execute", "with"];
const classManipulators = ["class", "type"];
const warns = {
  declare: ["deprecated", "no-type"],
  var: ["no-type"],
  webprompt: ["deprecated"],
  cmd: ["deprecated"],
  flush: ["deprecated"],
};
const types = ["number", "string", "boolean", "group", "relpos", "object"];
const customTypes = [];
const undoStack = [];
const redoStack = [];
/**@type {HTMLTextAreaElement} */
let inp = document.getElementById("input");
/**@type {HTMLDivElement} */
let oup = document.getElementById("txt-bg");

function focusEditor() {
  inp.focus();
}

inp.addEventListener("keydown", (ev) => {
  let actioned = false;
  let insert = function (charBef, charAft, withoutSelection = false) {
    if (inp.selectionStart !== inp.selectionEnd) {
      let srt = inp.selectionStart;
      let end = inp.selectionEnd;
      let before = inp.value.substring(0, srt);
      let middle = inp.value.substring(srt, end);
      let after = inp.value.substring(end);
      inp.value = before + charBef + middle + (charAft ?? charBef) + after;
      inp.selectionStart = srt + 1;
      inp.selectionEnd = end + 1;
      actioned = true;
    } else if (withoutSelection) {
      inp.value += charBef + (charAft ?? charBef);
      inp.selectionStart--;
      inp.selectionEnd--;
      actioned = true;
    }
  };
  if (ev.key === "[") {
    insert("[", "]", true);
  }
  if (ev.key === "(") {
    insert("(", ")", true);
  }
  if (ev.key === '"') {
    insert('"', undefined, true);
  }
  if (ev.key === "|") {
    inp.value += "\n| ";
    actioned = true;
  }
  if (ev.key === "#") {
    inp.value += "\n# ";
    actioned = true;
  }
  if (ev.key === "\\") {
    insert("\\");
  }

  if (actioned) {
    ev.preventDefault();
    delayedHighlight(inp);
  }
  //Undo stack thing
  if (ev.key === "z" && ev.ctrlKey) {
    let undoVal = undoStack.pop();
    //Undo!!!1!!
    if (undoVal) {
      redoStack.push(inp.value);
      inp.value = undoVal;
    }
  } else if (ev.key === "y" && ev.ctrlKey) {
    let redoVal = redoStack.pop();
    //Redo!!!1!!
    if (redoVal) {
      undoStack.push(inp.value);
      inp.value = redoVal;
    }
  } else if (undoStack.at(-1) !== inp.value) {
    undoStack.push(inp.value);
    //Can't redo anymore
    redoStack.splice(0);
  }
});

/**
 * @param {HTMLTextAreaElement} textarea
 */
function delayedHighlight(textarea) {
  highlight(textarea);
}

function getAllExtensionContent() {
  customKeywords.splice(0);
  customTypes.splice(0);
  for (let extension of window.islExtensions) {
    console.log();
    for (let keyword in extension.keywords) {
      let word = extension.keywords[keyword];
      customKeywords.push(keyword);
      if (word.deprecated) {
        if (!keyword in warns) warns[keyword] = [];
        warns[keyword].push("deprecated");
      }
    }
    customTypes.push(...extension.types.map((x) => x.name));
    customLabels.push(...extension.labels.map((x) => x.label));
  }
}

//apply highlights
function highlight(textarea) {
  getAllExtensionContent();
  const div = document.getElementById("txt-bg");
  const offsetDiv = document.getElementById("offset");
  const code = textarea.value;
  const lines = code.split("\n");
  const converted = lines.map((x) =>
    x.replaceAll(/\"[^\"]*\"/g, (x) => {
      //String Literals
      return (
        x
          //Add special characters here
          .replaceAll("\\", "🟥")
          .replaceAll(" ", "🟧")
          .replaceAll("[", "🟨")
          .replaceAll("]", "🟩")
          .replaceAll(":", "🟪")
          .replaceAll("-", "⬛")
      );
    })
  );
  const highlighted = converted.map((line) => {
    return getLineHighlights(line);
  });
  div.innerHTML = highlighted.length > 0 ? highlighted.join("<br>") : "<br>";
  textarea.value = textarea.value
    .split("\n")
    .map((x) => x.trimStart())
    .join("\n");
}

function allTypes() {
  return types.concat(customTypes);
}

function getLineHighlights(line) {
  if (line.substring(0, 2) === "//") {
    return `<span class="comment">${line}</span>`;
  }
  if (line.match(/^\[[^\[\]]*\]$/)) {
    return `<span class="metatag">${line}</span>`;
  }
  const tokens = line.trim().split(" ");
  const highlightedTokens = tokens.map((token) => {
    return getTokenHighlight(token, tokens);
  });
  return highlightedTokens.join(" ");
}

//get highlights
function getTokenHighlight(token, allTokens) {
  let tokenR = token;
  if (token in warns) {
    tokenR = `<span class='warning ${warns[token].join(" ")}'>${token}</span>`;
  }
  let newToken = token;
  newToken = newToken.replaceAll(/"[^"]*"/g, (x) => {
    return `<span class="string">${x
      .replaceAll("\\", "🟥")
      .replaceAll(" ", "🟧")
      .replaceAll("[", "🟨")
      .replaceAll("]", "🟩")
      .replaceAll(":", "🟪")
      .replaceAll('"', "🟫")
      .replaceAll("-", "⬛")}</span>`;
  });
  newToken = newToken.replaceAll(/\\[^\\]*\\/g, (x) => {
    return `<span class="getter">${x.replaceAll("\\", "🟥")}</span>`;
  });
  newToken = newToken.replaceAll(/:(?=<span class="getter">)/g, (x) => {
    return `<span class="parameter">🟪</span>`;
  });
  newToken = newToken.replaceAll(/-(?=<span class="getter">)/g, (x) => {
    return `<span class="variable">⬛</span>`;
  });
  newToken = newToken.replaceAll(/[^\\:]+(?<!\.):[^\\:]+/g, (x) => {
    let y = x.replaceAll(":", "🟪");
    let z = y.split("🟪");
    return `<span class="parameter">${z[0]}</span><span class="${
      allTypes().includes(z[1]) ? "type" : "bad-type error"
    }">:${z[1]}</span>`;
  });
  if (
    operators.includes(token) &&
    allTokens[allTokens.indexOf(token) - 2] === "if"
  ) {
    return `<span class="operator">${tokenR}</span>`;
  }
  if (keywords.includes(token)) {
    return `<span class="keyword">${tokenR}</span>`;
  }

  if (
    variableManipulators.includes(allTokens[allTokens.indexOf(token) - 1]) ||
    multiModeManipulators.includes(allTokens[allTokens.indexOf(token) - 2])
  ) {
    return `<span class="variable">${tokenR}</span>`;
  }
  if (functionManipulators.includes(allTokens[allTokens.indexOf(token) - 1])) {
    return `<span class="function">${tokenR}</span>`;
  }
  if (classManipulators.includes(allTokens[allTokens.indexOf(token) - 1])) {
    return `<span class="class">${tokenR}</span>`;
  }
  if (labels.includes(token)) {
    return `<span class="label">${tokenR}</span>`;
  }
  if (customLabels.includes(token)) {
    return `<span class="custom label">${tokenR}</span>`;
  }
  if (customKeywords.includes(token)) {
    return `<span class="custom keyword">${tokenR}</span>`;
  }

  if (token.match(/^\[[^\[\]]*\]$/)) {
    return `<span class="group">${tokenR}</span>`;
  }
  if (token.match(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)) {
    return `<span class="hex">${tokenR}</span>`;
  }

  if (token.match(/^-?[0-9]+(?:\.[0-9]+)?$/)) {
    return `<span class="number">${tokenR}</span>`;
  }
  if (token === "true" || token === "false") {
    return `<span class="bool">${tokenR}</span>`;
  }
  if (
    token.substring(0, 1) === "~" &&
    token.substring(1).match(/^-?[0-9]+(?:\.[0-9]+)?$/)
  ) {
    return `<span class="relative">${tokenR}</span>`;
  }
  newToken = newToken
    .replaceAll("🟧", " ")
    .replaceAll("🟥", "\\")
    .replaceAll("🟨", "[")
    .replaceAll("🟩", "]")
    .replaceAll("🟪", ":")
    .replaceAll("🟫", '"')
    .replaceAll("⬛", "-");
  if (!newToken.includes("<span class=")) {
    if (allTokens.indexOf(token) === 0) {
      return `<span class="unrecognised error">${newToken}</span>`;
    }
    return `<span class="unexpected error">${newToken}</span>`;
  }
  return newToken;
}
