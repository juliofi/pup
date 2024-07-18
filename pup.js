const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const readline = require('readline');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Por favor, insira o link do evento: ', async (eventLink) => {
    const browser = await puppeteer.launch({
      headless: false, // headless: false para abrir o navegador visivelmente
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Caminho padrão do Google Chrome no Mac
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: null
    });

    const page = await browser.newPage();

    // Limpa os dados de navegação antes de iniciar
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    await client.send('Storage.clearDataForOrigin', {
      origin: '*',
      storageTypes: 'all'
    });

    // Configura o User-Agent rotacionado
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3', 
      'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36', 
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0.1 Safari/601.1.56'
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

    // Adiciona cabeçalhos HTTP para imitar um navegador real
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Navega até a página inicial do Sympla
    await page.goto('https://www.sympla.com.br/');

    // Espera um tempo para o modal de login carregar
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Clica no botão "Acesse sua conta"
    await page.waitForSelector('button[id="btn-login"]', { visible: true });
    await page.click('button[id="btn-login"]');
    console.log('Clique em "Continuar com Facebook" e depois pressione ENTER...');

    process.stdin.once('data', async () => {
      // Identifica a nova aba do Facebook e preenche os campos de e-mail e senha
      const pages = await browser.pages();
      const facebookPage = pages[pages.length - 1];

      await facebookPage.bringToFront();
      await facebookPage.waitForSelector('#email', { visible: true });
      await facebookPage.type('#email', 'juliocpsf@gmail.com');
      await facebookPage.type('#pass', '03012005');
      console.log('Campos de e-mail e senha preenchidos.');

      // Clica no botão de login
      await facebookPage.waitForSelector('#loginbutton', { visible: true });
      await facebookPage.click('#loginbutton');
      console.log('Botão de login clicado.');

      // Volta para a página inicial do Sympla
      const symplaPage = await browser.pages();
      await symplaPage[0].bringToFront();

      // Verifica periodicamente se o login foi bem-sucedido
      const checkLoginInterval = setInterval(async () => {
        const isLoggedOut = await symplaPage[0].evaluate(() => {
          return document.querySelector('button[id="btn-login"]') !== null;
        });

        if (!isLoggedOut) {
          clearInterval(checkLoginInterval);
          console.log('Login bem-sucedido!');
          // Você pode salvar os cookies se desejar reutilizá-los mais tarde
          const cookies = await page.cookies();
          await fs.promises.writeFile('cookies.json', JSON.stringify(cookies, null, 2));

          // Abre uma nova aba com o link do evento
          const eventPage = await browser.newPage();
          await eventPage.goto(eventLink);

          console.log('Navegando para o link do evento:', eventLink);

          // Aguardando o carregamento dos botões
          await eventPage.waitForSelector('button[aria-label="Increase Amount"]', { visible: true });
          await eventPage.click('button[aria-label="Increase Amount"]');
          console.log('Ingressos aumentados com sucesso!');

          // Aguardando o carregamento do botão "Comprar Ingressos"
          await eventPage.waitForSelector('button[data-for="buy-button"]', { visible: true });
          await eventPage.click('button[data-for="buy-button"]');
          console.log('Botão "Comprar Ingressos" clicado com sucesso!');

          rl.close();
        } else {
          console.log('Erro no login. Tente novamente.');
          clearInterval(checkLoginInterval);
        }
      }, 3000); // Verifica a cada 3 segundos se o login foi feito
    });
  });
})();
