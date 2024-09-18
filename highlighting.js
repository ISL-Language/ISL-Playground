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
  //vars
  "string",
  "number",
  //functions
  "function",
  "end",
  "execute",
  //flow control
  "if",
  "jump",
  "stop",
  "rundelay",
  //IO
  "awaitkey",
  "getkeys",
  "popup-input",
  "log",
  "flush",
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
];
const customKeywords = [];
const labels = ["non-destructive", "separated", "grouped"];
const customLabels = [];
const operators = ["=", "<", ">", "!=", "in"];
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
  "set",
  "delete",
  "getkeys",
  "awaitkey",
];
const functionManipulators = ["cmd", "function", "end", "execute"];
const warns = {
  declare: ["deprecated", "no-type"],
  var: ["no-type"],
  webprompt: ["deprecated"],
  cmd: ["deprecated"],
};
const types = ["number", "string"];
const customTypes = []

function delayedHighlight(textarea) {
  //delay only needed for caret
  highlight(textarea);
  //setTimeout(highlight(textarea), 10)
}

function getAllExtensionContent() {
  customKeywords.splice(0);
  customTypes.splice(0);
  for (let extension of window.islExtensions) {
    console.log();
    for(let keyword in extension.keywords){
      let word = extension.keywords[keyword]
      customKeywords.push(keyword);
      if(word.deprecated){
        if(!keyword in warns) warns[keyword] = []
        warns[keyword].push("deprecated")
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

function allTypes(){
  return types.concat(customTypes)
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
  newToken = newToken.replaceAll(/[^\\:]+:[^\\:]+/g, (x) => {
    let y = x.replaceAll(":", "🟪");
    let z = y.split("🟪");
    return `<span class="parameter">${z[0]}</span><span class="${
      allTypes().includes(z[1]) ? "type" : "bad-type error"
    }">:${z[1]}</span>`;
  });
  if (variableManipulators.includes(allTokens[allTokens.indexOf(token) - 1])) {
    return `<span class="variable">${tokenR}</span>`;
  }
  if (functionManipulators.includes(allTokens[allTokens.indexOf(token) - 1])) {
    return `<span class="function">${tokenR}</span>`;
  }
  if (labels.includes(token)) {
    return `<span class="label">${tokenR}</span>`;
  }
  if (customLabels.includes(token)) {
    return `<span class="custom label">${tokenR}</span>`;
  }
  if (keywords.includes(token)) {
    return `<span class="keyword">${tokenR}</span>`;
  }
  if (customKeywords.includes(token)) {
    return `<span class="custom keyword">${tokenR}</span>`;
  }
  if (token.match(/^\[[^\[\]]*\]$/)) {
    return `<span class="group">${tokenR}</span>`;
  }
  if (token.match(/^#[0-9a-f]{6}$/)) {
    return `<span class="hex">${tokenR}</span>`;
  }
  if (
    operators.includes(token) &&
    allTokens[allTokens.indexOf(token) - 2] === "if"
  ) {
    return `<span class="operator">${tokenR}</span>`;
  }
  if (token.match(/^-?[0-9]+(?:\.[0-9]+)?$/)) {
    return `<span class="number">${tokenR}</span>`;
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
