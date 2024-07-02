const fs = require("fs");

const { checkProxy } = require("./mainUtils");

const {
  checkFile,
  removeEmptyLines,
  filerProxies,
  list,
  listResult,
} = require("./proxyUtils");

async function checkProxies() {
  const proxyString = fs.readFileSync(list, "utf-8");
  const proxies = proxyString.split("\n").map((s) => s.trim());

  const proxyPromises = proxies.map((proxy) => checkProxy(proxy));
  const results = await Promise.all(proxyPromises);

  let existingResults = fs.readFileSync(listResult, "utf-8");
  let resultLines = existingResults.split("\n");

  results.forEach((logMessage) => {
    const proxy = logMessage.split(" - ")[0];
    const existingIndex = resultLines.findIndex((line) =>
      line.startsWith(proxy)
    );

    if (existingIndex !== -1) {
      resultLines[existingIndex] = logMessage;
    } else {
      resultLines.push(logMessage);
    }
  });

  console.log("результаты записаны");

  fs.writeFileSync(listResult, resultLines.join("\n"));
  removeEmptyLines(listResult);
}

(async function main() {
  removeEmptyLines(list);
  fs.writeFileSync(listResult, "");

  if (checkFile(list) && fs.existsSync(listResult)) {
    const repeatTimes = parseInt(process.argv[2]);

    if (!isNaN(repeatTimes) && repeatTimes > 0) {
      for (let i = 0; i < repeatTimes; i++) {
        if (checkFile(list) && fs.existsSync(listResult)) {
          await checkProxies();
          filerProxies(listResult, list, "работает");
        } else {
          return;
        }
      }
      console.log("все проверены");
    } else {
      console.log("Ввод отменен или введено некорректное значение.");
    }
  }
})();
