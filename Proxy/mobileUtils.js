const Services = ".main-menu > li:nth-child(3) > span:nth-child(1)";
const Settings = "li.el-menu-item:nth-child(4) > span:nth-child(1)";
const System = "xpath=/html/body/div/div[2]/ul/li[5]/span";

//Services
const SMS =
  "xpath=/html/body/div/div[2]/div/div[1]/div[1]/div/ul/div[1]/li/div";
const SMSin = "ul.el-menu:nth-child(2) > li:nth-child(1)";
const LastMessage =
  "xpath=/html/body/div[1]/div[2]/div/div/div[2]/div/div/div[1]/div[1]/div[3]/table/tbody/tr[1]/td[3]/div/span";
const SMSout = "ul.el-menu:nth-child(2) > li:nth-child(2)";
const SMSwrite = "ul.el-menu:nth-child(2) > li:nth-child(4)";
const SMSsettings = "ul.el-menu:nth-child(2) > li:nth-child(5)";
const USSD = "xpath=/html/body/div/div[2]/div/div/div[1]/div/ul/div[2]/li/span";

//Settings
const DataTranfser =
  "#sideMenu > ul:nth-child(1) > div:nth-child(2) > li:nth-child(1) > div:nth-child(1) > span:nth-child(2)";
const NetSettings = "li[title='Настройки сети']";
const NetMode = ".el-input__inner";
const LTEUMTSGSM = "li.el-select-dropdown__item:nth-child(1)";

//System
const menuReboot =
  "xpath=/html/body/div/div[2]/div/div/div[1]/div/ul/div[2]/li/span";
const rebootButton =
  "xpath=/html/body/div/div[2]/div/div/div[2]/div/div[1]/form/button/span";
const rebootConfirm = "xpath=/html/body/div[2]/div/div[3]/button[2]/span";

async function ChangeNetwork(page) {
  await page.waitForNavigation({ waitUntil: "networkidle" });

  await page.waitForSelector(Settings);
  const SettingsButton = await page.$(Settings);
  await SettingsButton.click();

  await page.waitForNavigation({ waitUntil: "networkidle" });

  await page.waitForSelector(DataTranfser);
  const DataTransferButton = await page.$(DataTranfser);
  await DataTransferButton.click();

  await page.waitForSelector(NetSettings, { visible: true });
  await page.waitForTimeout(750);
  const NetSettingsButton = await page.$(NetSettings);
  await NetSettingsButton.click();
  await page.waitForTimeout(750);

  await page.waitForSelector(NetMode, { visible: true });
  await page.click(NetMode);
  await page.waitForTimeout(750);

  await page.waitForSelector(LTEUMTSGSM, {
    visible: true,
  });
  await page.click(LTEUMTSGSM);
  await page.waitForTimeout(750);

  const ApplyButton = "button.el-button:nth-child(1) > span:nth-child(1)";
  await page.click(ApplyButton);
  await page.waitForTimeout(750);

  //confirm if needed
  const confirm = "button.el-button--default:nth-child(2) > span:nth-child(1)";
  const popUpAppeared = page
    .waitForSelector(confirm, { visible: true, timeout: 3000 })
    .then(
      () => true,
      () => false
    );

  if (await popUpAppeared) {
    await page.click(confirm);
  }
  await page.waitForTimeout(750);
}

async function TypeUSSD(page, text) {
  const USSDinput =
    "xpath=/html/body/div/div[2]/div/div[1]/div[2]/div/div/form/div/div/div/div/input";
  const send = ".el-button > span:nth-child(1)";
  const errorMSG = ".el-form-item__error";

  await page.click(Services);
  await page.waitForTimeout(500);

  await page.isVisible(USSD);
  await page.click(USSD);
  await page.waitForTimeout(500);

  await TypeText(page, USSDinput, text);
  await page.waitForTimeout(1000);
  await page.click(send);
  await page.waitForTimeout(2000);

  if (await page.isVisible(errorMSG)) {
    await TypeText(page, USSDinput, text);
    await page.waitForTimeout(2000);
    await page.click(send);
  }

  await page.waitForSelector(".el-dialog__body", { state: "hidden" });
  await page.waitForSelector(".dialogue", { state: "visible" });
  let USSDtext = await page.locator(".dialogue").textContent();
  let i = 0;

  while (USSDtext === "USSD error" && i < 5) {
    await TypeText(page, USSDinput, text);
    await page.waitForTimeout(1000);
    await page.click(send);
    await page.waitForTimeout(2000);
    await page.waitForSelector(".el-dialog__body", { state: "hidden" });
    await page.waitForSelector(".dialogue", { state: "visible" });
    USSDtext = await page.locator(".dialogue").textContent();
    i++;
  }

  if (USSDtext.includes("Запрос принят. Информация отправлена в SMS.")) {
    await page.click(SMS);

    const income = "ul.el-menu:nth-child(2) > li:nth-child(1)";

    await page.waitForSelector(income);
    const incomeButon = await page.$(income);
    await incomeButon.click();

    await page.waitForSelector(LastMessage, {
      state: "visible",
    });

    const text = await page.locator(LastMessage).textContent();

    if (text.includes("доступа")) {
      return "Корпоративный номер, нет доступа";
    } else {
      return text;
    }
  } else {
    return USSDtext;
  }
}

async function SendSMS(page, receiver, text) {
  const MsgReciever = "input.el-input__inner:nth-child(2)";
  const MsgInput = ".el-textarea__inner";
  const MsgSend = "button.el-button--primary:nth-child(1) > span:nth-child(1)";
  const errorMSG = ".el-message-box__message > p:nth-child(1)";
  const errorMSGbutton =
    "button.el-button--default:nth-child(2) > span:nth-child(1)";

  if (!(await page.isVisible(SMS))) {
    await page.click(Services);
    await page.waitForTimeout(500);
  }

  if (!(await page.isVisible(SMSwrite))) {
    await page.click(SMS);
    await page.waitForTimeout(500);
  }

  await page.click(SMSwrite);

  try {
    await page.waitForSelector(errorMSG, { state: "visible", timeout: 2000 });
    const err = await page.locator(errorMSG).textContent();
    await page.click(errorMSGbutton);
    if (err.includes("Память")) {
      console.log("Память заполнена, очистка...");
      await ClearMSG(page);
      try {
        await TypeText(page, MsgReciever, receiver);
        await TypeText(page, MsgInput, text);
        await page.click(MsgSend);
        console.log(`Сообщение ${text} отправлено`);
      } catch (error) {
        console.log(`Ошибка при отправке сообщения: ${error}`);
        return;
      }
    }
  } catch {
    try {
      await TypeText(page, MsgReciever, receiver);
      await TypeText(page, MsgInput, text);
      await page.click(MsgSend);
      console.log(`Сообщение ${text} отправлено`);
    } catch (error) {
      console.log(`Ошибка при отправке сообщения: ${error}`);
      return;
    }
  }
  await page.waitForTimeout(500);
}

async function ClearMSG(page) {
  if (!(await page.isVisible(SMS))) {
    await page.click(Services);
    await page.waitForTimeout(500);
  }

  if (!(await page.isVisible(SMSsettings))) {
    await page.click(SMS);
    await page.waitForTimeout(500);
  }

  await page.click(SMSsettings);
  await page.waitForTimeout(1000);
  await page.click(
    "label.el-radio:nth-child(2) > span:nth-child(1) > span:nth-child(1)"
  );
  await page.waitForTimeout(1000);
  await page.click(
    "button.el-button--primary:nth-child(1) > span:nth-child(1)"
  );
  await page.waitForTimeout(1000);

  await page.click(SMSin);
  await page.waitForTimeout(2000);
  await CheckDelConfirm(page);

  await page.click(SMSout);
  await page.waitForTimeout(2000);
  await CheckDelConfirm(page);

  await page.click(SMSsettings);
  await page.waitForTimeout(1000);
  await page.click(
    "label.el-radio:nth-child(1) > span:nth-child(1) > span:nth-child(1)"
  );
  await page.waitForTimeout(1000);
  await page.click(
    "button.el-button--primary:nth-child(1) > span:nth-child(1)"
  );
  await page.waitForTimeout(1000);

  await page.click(SMSin);
  await page.waitForTimeout(2000);
  await CheckDelConfirm(page);

  await page.click(SMSout);
  await page.waitForTimeout(2000);
  await CheckDelConfirm(page);

  console.log("Сообщения очищены");
  await page.waitForTimeout(500);
}

async function CheckDelConfirm(page) {
  const LastMessage =
    "xpath=/html/body/div[1]/div[2]/div/div/div[2]/div/div/div[1]/div[1]/div[3]/table/tbody/tr[1]";
  let text = await page.locator(".tipsInfo").textContent();
  let Memory = text.match(/(\d+)\/\d+/);
  const del =
    "xpath=/html/body/div[1]/div[2]/div/div/div[2]/div/div/div[1]/button/span";
  const confirm = "button.el-button--default:nth-child(2) > span:nth-child(1)";

  while (Memory[1] > 0 && (await page.isVisible(LastMessage))) {
    try {
      let i = 0;
      const startColumn = 1;
      const endColumn = 100;
      let found = false;
      let selector;

      for (i = startColumn; i <= endColumn; i++) {
        selector = `th.el-table_1_column_${i} > div:nth-child(1) > label:nth-child(1) > span:nth-child(1) > span:nth-child(1)`;
        if (await page.isVisible(selector)) {
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("Не удалось найти чекбокс на странице.");
        return;
      } else {
        let isChecked = await page.isChecked(selector);
        if (!isChecked) {
          await page.click(selector);
        }
        await page.waitForTimeout(500);
        await page.click(del);
        await page.waitForTimeout(1000);
        await page.click(confirm);
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log("Ошибка: ", error);
    }
    text = await page.locator(".tipsInfo").textContent();
    Memory = text.match(/(\d+)\/\d+/);
  }

  await page.waitForTimeout(2000);
}

async function TypeText(page, selector, text) {
  const inputLocator = page.locator(selector);

  await inputLocator.waitFor({ state: "visible" });

  await inputLocator.fill(text);
  await page.waitForTimeout(500);
}

async function enterPass(page) {
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

async function mobileReboot(page) {
  await page.waitForSelector(System);
  await page.click(System);

  await page.waitForSelector(menuReboot);
  await page.click(menuReboot);

  await page.waitForSelector(rebootButton);
  await page.click(rebootButton);

  await page.waitForSelector(rebootConfirm);
  await page.click(rebootConfirm);
}

module.exports = {
  ChangeNetwork,
  enterPass,
  TypeUSSD,
  SendSMS,
  ClearMSG,
  mobileReboot,
};
