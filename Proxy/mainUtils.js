const axios = require("axios");
const { HttpProxyAgent } = require("http-proxy-agent");
const {
  parseProxyString,
  mobilePass,
  residentPass,
  tandemPass,
} = require("./proxyUtils");

const { mobileReboot } = require("./mobileUtils");

const { firefox } = require("playwright");

async function checkProxy(proxyStr) {
  if (proxyStr.length < 1) {
    console.log("Строка прокси пуста");
    return;
  }

  const httpAgent = new HttpProxyAgent(`http://${proxyStr}`, {
    rejectUnauthorized: false,
  });

  const { routerAddress } = parseProxyString(proxyStr);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Cache-Control": "no-cache",
  };

  try {
    await axios.get("http://mail.ru", { headers, httpAgent, timeout: 5000 });

    try {
      await axios.get("http://dev-null.su/", {
        headers,
        httpAgent,
        timeout: 5000,
      });

      console.log(`${proxyStr} - неоплачен`);
      return `${proxyStr} - неоплачен`;
    } catch {}

    console.log(`${proxyStr} - работает`);
    return `${proxyStr} - работает`;
  } catch {
    try {
      const res = await axios.get(routerAddress, {
        headers,
        httpAgent,
        timeout: 5000,
      });

      console.log(`${proxyStr} - без интернета`);
      return `${proxyStr} - без интернета`;
    } catch {
      console.log(`${proxyStr} - НЕДОСТУПЕН`);
      return `${proxyStr} - НЕДОСТУПЕН`;
    }
  }
}

async function rebootProxy(proxyStr) {
  const { username, password, ip, port, routerAddress } =
    parseProxyString(proxyStr);

  try {
    const check = await checkProxy(proxyStr);

    if (check == `${proxyStr} - НЕДОСТУПЕН`) {
      console.log(`${proxyStr} - НЕДОСТУПЕН`);
      return `${proxyStr} - НЕДОСТУПЕН`;
    }
  } catch (error) {
    console.log(`${proxyStr} - ошибка`, error);
    return `${proxyStr} - ошибка`, error;
  }

  try {
    const browser = await firefox.launch({
      proxy: { server: `http://${ip}:${port}`, username, password },
      headless: true,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 Firefox/89.0",
    });

    const page = await context.newPage();

    const navigationPromise = page.waitForNavigation({
      waitUntil: "networkidle",
      timeout: 10000,
    });

    try {
      await page.goto(routerAddress, { timeout: 10000 });
      await navigationPromise;
    } catch (error) {
      console.log(`${proxyStr} - НЕДОСТУПЕН`);

      return `${proxyStr} - НЕДОСТУПЕН`;
    }

    try {
      const firstSelector = await Promise.race([
        page.waitForSelector("body > h4:nth-child(1)", { timeout: 5000 }),
        page.waitForSelector("body > h2:nth-child(1)", { timeout: 5000 }),
      ]);

      const text = await firstSelector.textContent();
      if (text === "401 Unauthorized" || text === "403 Access Denied") {
        console.log(`${proxyStr} - нет доступа`);
        await browser.close();

        return `${proxyStr} - нет доступа`;
      }
    } catch (error) {
      if (
        !/waiting for locator\('body > h[42]:nth-child\(1\)'\) to be visible/.test(
          error.message
        )
      ) {
        console.log(`${proxyStr} - ошибка`);

        return `${proxyStr} - ошибка`;
      }
    }

    const finalUrl = page.url();

    if (finalUrl.includes("/cgi-bin/luci/")) {
      try {
        await residentPass(page);
      } catch (error) {
        console.log(`${proxyStr} - не удалось ввести пароль, резидент`);

        return `${proxyStr} - не удалось ввести пароль, резидент`;
      }

      await page.goto(`${routerAddress}/cgi-bin/luci/admin/system/reboot`);

      try {
        await page.waitForSelector(`.cbi-button`);
        await page.click(".cbi-button");
      } catch (error) {
        console.log(`${proxyStr} - не удалось найти кнопку ребута`);

        return `${proxyStr} - не удалось найти кнопку ребута`;
      }

      await page.waitForTimeout(500);
      await browser.close();
    } else if (finalUrl.includes("/index.html#/index")) {
      try {
        await mobilePass(page);
      } catch (error) {
        console.log(`${proxyStr} - не удалось ввести пароль, мобильный роутер`);

        return `${proxyStr} - не удалось ввести пароль, мобильный роутер`;
      }

      try {
        await mobileReboot(page);
      } catch (error) {
        console.log(`${proxyStr} - не удалось перезагрузить мобильный роутер`);

        return `${proxyStr} - не удалось перезагрузить мобильный роутер`;
      }

      await page.waitForTimeout(500);

      await browser.close();
    } else if (finalUrl.includes("/cgi-bin/luci")) {
      try {
        await tandemPass(page);
      } catch (error) {
        console.log(`${proxyStr} - не удалось ввести пароль тандем`);

        return `${proxyStr} - не удалось ввести пароль тандем`;
      }

      await page.goto(`${routerAddress}/cgi-bin/luci//admin/system/reboot`);

      try {
        await page.waitForSelector(`.cbi-button`);
        await page.click(".cbi-button");
      } catch (error) {
        console.log(`${proxyStr} - не удалось найти кнопку ребута`);

        return `${proxyStr} - не удалось найти кнопку ребута`;
      }

      await page.waitForTimeout(500);
      await browser.close();
    } else {
      console.log(`${proxyStr} - неопознанный интерфейс`);

      return `${proxyStr} - неопознанный интерфейс`;
    }

    console.log(`${proxyStr} - перезагружен`);
    return `${proxyStr} - перезагружен`;
  } catch (error) {
    console.log(`${proxyStr} - ошибка`, error);
    return `${proxyStr} - ошибка`;
  }
}

module.exports = {
  checkProxy,
  rebootProxy,
};
