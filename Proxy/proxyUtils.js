const fs = require("fs");

const Proxies = "Proxies.txt";
const list = "list.txt";
const listResult = "RESULT.txt";

function checkFile(file) {
  try {
    if (!fs.existsSync(file)) {
      console.log(`Файл ${file} не найден.`);
      return false;
    }

    const fileContent = fs.readFileSync(file, "utf-8").trim();
    if (fileContent.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Произошла ошибка при чтении файла: ${error.message}`);
    return false;
  }
}

function removeEmptyLines(file) {
  try {
    const fileContent = fs.readFileSync(file, "utf-8");

    const filteredContent = fileContent
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");

    fs.writeFileSync(file, filteredContent);
  } catch (error) {
    console.error(`Ошибка при обработке файла: ${error.message}`);
  }
}

function filerProxies(listResultPath, listPath, filter) {
  if (checkFile(listResultPath) && checkFile(listPath)) {
    const results = fs
      .readFileSync(listResultPath, "utf-8")
      .split("\n")
      .map((line) => line.trim());

    const filteredProxies = results
      .filter((line) => line.includes(filter))
      .map((line) => line.split(" ")[0]);

    let proxies = fs
      .readFileSync(listPath, "utf-8")
      .split("\n")
      .map((line) => line.trim());

    proxies = proxies.filter((proxy) => !filteredProxies.includes(proxy));

    fs.writeFileSync(listPath, proxies.join("\n"));
  }
}

function findProxyLine(input) {
  const lines = fs.readFileSync(Proxies, "utf-8").split("\n");

  for (let line of lines) {
    if (line.includes(input)) {
      return line.trim();
    }
  }

  return null;
}

function readProxiesFromFile(file) {
  return fs
    .readFileSync(file, "utf-8")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function parseProxyString(proxyStr) {
  const [credentials, ipAndPort] = proxyStr.split("@");
  const [username, password] = credentials.split(":");
  const [ip, port] = ipAndPort.split(":");
  const router = port.slice(-2).replace(/^0/, "");
  const routerAddress = `http://192.168.${router}.1`;

  return { username, password, ip, port, routerAddress };
}

async function mobilePass(page) {
  const passwordInputXPath =
    "/html/body/div/div[2]/div/form/div/div[2]/div/form/div/form/div[2]/input";
  const confirmButtonXPath =
    "/html/body/div/div[2]/div/form/div/div[2]/div/form/div/form/div[5]/button";

  const password = "admin";

  await page.waitForSelector(`xpath=${passwordInputXPath}`);
  const passwordInput = await page.$(`xpath=${passwordInputXPath}`);
  await passwordInput.type(password);

  await page.waitForSelector(`xpath=${confirmButtonXPath}`);
  const confirmButton = await page.$(`xpath=${confirmButtonXPath}`);
  await confirmButton.click();
}

async function residentPass(page) {
  const passwordInputXPath1 = "//*[@id='luci_password']";
  const passwordInputXPath2 =
    "/html/body/div[2]/div/form/div/div/div[2]/div/input";

  const confirmButtonXPath1 = "/html/body/div[2]/div/button";
  const confirmButtonXPath2 = "input.btn:nth-child(1)";

  const errorMessageXPath = "/html/body/div[2]/div/div";
  const passwords = ["admin"];

  async function findPasswordInput() {
    const input1 = await page.$(`xpath=${passwordInputXPath1}`);
    if (input1) return input1;

    const input2 = await page.$(`xpath=${passwordInputXPath2}`);
    return input2;
  }

  async function findConfirmButton() {
    const button1 = await page.$(`xpath=${confirmButtonXPath1}`);
    if (button1) return button1;

    const button2 = await page.$(confirmButtonXPath2);
    return button2;
  }

  for (const password of passwords) {
    const passwordInput = await findPasswordInput();

    if (!passwordInput) {
      break;
    }

    const confirmButton = await findConfirmButton();

    if (!confirmButton) {
      break;
    }

    await passwordInput.fill("");
    await passwordInput.type(password);

    await confirmButton.click();

    try {
      await page.waitForSelector(`xpath=${errorMessageXPath}`, {
        timeout: 3000,
      });
    } catch (error) {
      break;
    }
  }
}

async function tandemPass(page) {
  const passwordInputPath = ".cbi-input-password";
  const confirmButtonPath = ".cbi-button";
  const passwords = ["admin"];

  for (const password of passwords) {
    const passwordInput = await page.$(passwordInputPath);

    if (passwordInput === null) {
      throw new Error("Элемент ввода пароля не найден");
    }

    await passwordInput.type(password);

    await page.waitForSelector(confirmButtonPath);
    const confirmButton = await page.$(confirmButtonPath);

    if (confirmButton === null) {
      throw new Error("Кнопка подтверждения не найдена");
    }

    await confirmButton.click();
    break;
  }
}

module.exports = {
  checkFile,
  removeEmptyLines,
  findProxyLine,
  parseProxyString,
  filerProxies,
  readProxiesFromFile,
  mobilePass,
  residentPass,
  tandemPass,
  list,
  listResult,
};
