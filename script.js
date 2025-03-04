import { ISLInterpreter } from "https://cdn.jsdelivr.net/gh/LightningLaser8/ISL@v0.3.1-alpha.2/core/interpreter.js";
import { ISLFileLoader } from "./loader.js";
/** @type { ISLInterpreter } */
const interp = new ISLInterpreter({
  name: "ISL Playground",
  instructions: 30,
  haltOnDisallowedOperation: true,
  allowCommunicationDefault: true,
  onerror: error,
  onwarn: warn,
  onlog: log,
});
const loader = new ISLFileLoader();
const input = document.getElementById("input");
const speedInput = document.getElementById("speed-input");
const filename = document.getElementById("filename-input");
const instructionsInput = document.getElementById("instructions-input");

loader.setupInput("isl-loader-file-upload");
loader.onload((isl) => {
  input.value = isl.join("\n");
  input.click();
});

function go() {
  console.log("Loading ISL into interpreter...");
  interp.stopExecution();
  interp.loadISL(input.value.split("\n"), "<user input>");
  interp.startExecution(speedInput.value ?? 1, instructionsInput.value ?? 1);
  console.log("Started!")
}
function restart() {
  console.log("Restarting...")
  interp.stopExecution();
  interp.startExecution(speedInput.value ?? 1, instructionsInput.value ?? 1);
}

function stop() {
  console.log("Stopped!")
  interp.stopExecution();
}
function pause() {
  console.log("Paused...")
  interp.pauseExecution();
}
function resume() {
  console.log("...Resumed")
  interp.startExecution();
}
function clear() {
  console.log("Cleared!")
  interp.clear()
}
function giveButtonFunction(id, func) {
  document.getElementById(id).onclick = () => {
    func();
  };
}
function autoGiveFunction(func) {
  document.getElementById(func.name + "-button").onclick = () => {
    func();
  };
}

function error(msg) {
  const errors = document.getElementById("errors");
  errors.value = msg + "\n";
  toBottom(errors);
}
function log(msg) {
  const logs = document.getElementById("logs");
  logs.value += msg + "\n";
  toBottom(logs);
}
function warn(msg) {
  const warnings = document.getElementById("warnings");
  warnings.value += msg + "\n";
  toBottom(warnings);
}

function clearOutputs() {
  const errors = document.getElementById("errors");
  errors.value = "";
  toBottom(errors);
  const logs = document.getElementById("logs");
  logs.value = "";
  toBottom(logs);
  const warnings = document.getElementById("warnings");
  warnings.value = "";
  toBottom(warnings);
}

function toBottom(textarea) {
  textarea.scrollTop = textarea.scrollHeight;
}

function saveStrings(array, filename) {
  saveString(array.join("\n"), filename);
}

function saveString(content, filename = "program") {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename + ".isl";
  a.click();
}

function save() {
  saveString(input.value, filename.value);
}

autoGiveFunction(go);
autoGiveFunction(restart);
autoGiveFunction(resume);
autoGiveFunction(stop);
autoGiveFunction(clear);
autoGiveFunction(clearOutputs);
autoGiveFunction(pause);
autoGiveFunction(save);

const imported = [];
const added = [];
const requests = [];

function isClass(v) {
  return typeof v === "function" && /^\s*class\s+/.test(v.toString());
}
const display = document.getElementById("ext-import-imported");
const addedDisplay = document.getElementById("ext-import-added");
function updateImportsList() {
  display.innerHTML = "";
  for (let extension of imported) {
    const span = document.createElement("span");
    //Remove
    const removeButton = document.createElement("button");
    const removeInfo = document.createElement("popup-info");
    removeInfo.setAttribute(
      "content",
      "Remove this extension from the list. This cannot be added back once removed!"
    );
    removeButton.onclick = () => {
      imported.splice(imported.indexOf(extension), 1);
      updateImportsList();
    };
    removeButton.innerText = "- ";
    removeButton.appendChild(removeInfo);
    //Add to interpreter
    const addButton = document.createElement("button");
    const addInfo = document.createElement("popup-info");
    addInfo.setAttribute(
      "content",
      "Add this extension to the interpreter. If it's a class, no extra parameters will be passed into the constructor."
    );
    addButton.onclick = () => {
      imported.splice(imported.indexOf(extension), 1);
      if (extension.isClass) {
        interp.classExtend(extension.ext);
        added.push(new extension.ext(new ISLInterpreter()));
      } else {
        interp.extend(extension.ext);
        added.push(extension.ext);
      }
      addToAddedExtensions(extension);
      span.removeChild(addButton);
      span.removeChild(removeButton);
      span.appendChild(document.createTextNode("(Added)"));
    };
    addButton.innerText = "+ ";
    addButton.appendChild(addInfo);

    span.classList.add("imported-extension");
    span.innerText = extension.id + " ";
    span.appendChild(addButton);
    span.appendChild(removeButton);
    display.appendChild(span);
  }
}

function getInstanceOrSelf(item, ...constructorParams) {
  if (item.isClass || isClass(item)) {
    return new item(...constructorParams);
  } else {
    return item;
  }
}

function getTooltip(extension, extInfo) {
  let content = `
  <style>
    .info{
      color: white;
      background-color: #202020;
      width: auto;
    }
  </style>
  <span class=\"inline syntax\">
  <h1>Extension&nbsp;'${extInfo.id}'</h1>`;

  content += "<h3>Info:</h3>"
  content += "Type: "+(extInfo.isClass?"Class Extension"+" ("+extension.constructor.name+")":"Instance Extension")+"<br>"
  content += "Source: "+(extInfo.source??"unknown")
  content += "<h3>'Require' Metatag:</h3><span class=\"metatag\">[require "+extension.id+"]</span>"


  content += "<h2>Content:</h2>";
  content += "<h3>Keywords:</h3>";
  if (Object.keys(extension.keywords).length === 0) content += "(none)<br>";
  for (let keyword of Object.keys(extension.keywords).sort()) {
    content += '<span class="custom keyword">' + keyword + "</span><br>";
  }

  content += "<h3>Labels:</h3>";
  if (extension.labels.length === 0) content += "(none)<br>";
  for (let label of extension.labels.slice(0).sort(dynamicSort("label"))) {
    content +=
      '<span class="custom label">' +
      label.label +
      '</span>&nbsp;for&nbsp;<span class="custom keyword">' +
      label.for.sort().join('</span>,&nbsp;<span class="custom keyword">') +
      "</span><br>";
  }

  content += "<h3>Global Variables:</h3>";
  if (Object.keys(extension.variables).length === 0) content += "(none)<br>";
  for (let variable of Object.keys(extension.variables).sort()) {
    content +=
      '<span class="variable">' +
      variable +
      '</span> (<span class="type">' +
      extension.variables[variable].type +
      "</span>)<br>";
  }

  content += "</span>";
  console.log(extension);
  return content;
}

function addToAddedExtensions(extension) {
  const span = document.createElement("span");
  span.classList.add("imported-extension");
  span.innerText = extension.id;
  const info = document.createElement("popup-info");
  info.setAttribute("copy-style-from", "highlighting.css");
  info.setAttribute(
    "content",
    getTooltip(getInstanceOrSelf(extension.ext, new ISLInterpreter()), extension)
  );
  span.appendChild(info);
  addedDisplay.appendChild(span);
}

function importExtension() {
  const url = document.getElementById("ext-import-url").value;
  const extName = document.getElementById("ext-import-name").value;
  const errorOut = document.getElementById("ext-import-errors");
  if (requests.includes(url + ":" + extName)) {
    errorOut.innerText = "Duplicate request blocked.";
    return;
  }
  errorOut.innerText = "Working...";
  addExtensions(url, extName, errorOut);
}

function addExtensions(url, extName, errorOut) {
  const start = Date.now();
  if (extName === "*") {
    requestModule(url, extName).then(
      (value) => {
        errorOut.innerText =
          value.length +
          " extensions retrieved in " +
          (Date.now() - start) +
          "ms";
        requests.push(url + ":" + extName);
        imported.push(...value);
        updateImportsList();
      },
      (reason) => {
        errorOut.innerText = "Error: " + reason;
      }
    );
  } else {
    requestSpecificExtension(url, extName).then(
      (value) => {
        errorOut.innerText =
          "Extension '" +
          value.name +
          "' (id " +
          value.id +
          ") retrieved in " +
          (Date.now() - start) +
          "ms";
        requests.push(url + ":" + extName);
        imported.push(value);
        updateImportsList();
      },
      (reason) => {
        errorOut.innerText = "Error: " + reason;
      }
    );
  }
}

async function requestModule(url) {
  return new Promise((resolve, reject) => {
    import("" + url).then(
      (module) => {
        console.log("module found:", module);
        const imported = [];
        for (let extName in module) {
          const extension = module[extName];
          if (extension) {
            if (isClass(extension)) {
              if (extension.__proto__.name === "ISLExtension") {
                const instance = new extension(new ISLInterpreter());
                imported.push({
                  ext: extension,
                  name: extName,
                  id: instance.id,
                  isClass: true,
                  source: url
                });
              }
            } else if (extension[Symbol.toStringTag] === "ISLExtension") {
              imported.push({
                ext: extension,
                name: extName,
                id: extension.id,
                isClass: false,
                source: url
              });
            }
          }
          if (imported.length === 0) {
            reject("No ISL Extensions in module");
          } else {
            resolve(imported);
          }
        }
      },
      (reason) => {
        reject(
          "Could not import from\n" +
            url +
            ":\n" +
            (URL.canParse(url) ? "Unreachable / Not found" : "Invalid URL")
        );
      }
    );
  });
}

async function requestSpecificExtension(url, extName) {
  return new Promise((resolve, reject) => {
    import("" + url).then(
      (module) => {
        console.log("module found:", module);
        const extension = module[extName];
        if (extension) {
          if (isClass(extension)) {
            if (!(extension.__proto__.name === "ISLExtension")) {
              reject("Imported class is not an extension!");
            } else {
              const instance = new extension(new ISLInterpreter());
              resolve({
                ext: extension,
                name: extName,
                id: instance.id,
                isClass: true,
                source: url
              });
            }
          } else if (extension[Symbol.toStringTag] === "ISLExtension") {
            resolve({
              ext: extension,
              name: extName,
              id: extension.id,
              isClass: false,
              source: url
            });
          } else {
            reject(
              "Imported object is neither a class nor an instance of ISLExtension."
            );
          }
        } else {
          reject("Property " + extName + " does not exist in module.");
        }
      },
      (reason) => {
        reject(
          "Could not import from " +
            url +
            ": " +
            (URL.canParse(url) ? "Unreachable / Not found" : "Invalid URL")
        );
      }
    );
  });
}

window.islExtensions = added;

autoGiveFunction(importExtension);

function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      /* next line works with strings and numbers, 
       * and you may want to customize it to your needs
       */
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
}