const puppeteer = require('puppeteer');

(async () => {
  // Iniciar o navegador
  const browser = await puppeteer.launch({
    headless: false, // Abrir o navegador em modo não-headless para visualizar a operação
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Caminho padrão do Chrome no Mac
  });

  // Abrir uma nova página
  const page = await browser.newPage();

  // Navegar até o site da Sympla
  await page.goto('https://www.sympla.com.br/');

  // Esperar um pouco para garantir que a página carregue completamente
  await page.waitForTimeout(5000);

  // Fechar o navegador
  await browser.close();
})();
