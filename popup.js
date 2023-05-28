const main = async () => {
  const loadText = async (filename) =>
    (await fetch(chrome.runtime.getURL(filename))).text();

  const extensionContext = () => {
    const form = document.querySelector('form');

    const textarea = document.getElementById('prompt-textarea');

    function decreasePrompt() {
      form.setAttribute(
        'style',
        'margin-left: auto; margin-right: auto; max-width: 48rem;',
      );
      textarea.setAttribute('style', 'height: 24px; max-height: 200px;');
    }

    function resetPrompt() {
      decreasePrompt();
      textarea.value = '';
    }

    function increasePrompt() {
      form.setAttribute(
        'style',
        'margin-left: 30px; margin-right: 30px; width: 100vw; max-width: 80vw;',
      );
      textarea.setAttribute(
        'style',
        'height: auto; max-height: 80vh; width: 100%;',
      );
    }

    function pasteText(text) {
      increasePrompt();
      console.info('Pasting ' + text.length + ' characters into GPT prompt');
      textarea.value = text;
      textarea.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          setTimeout(function () {
            textarea.value = '';
            textarea.style.height = '24px';
          }, 100);
        }
      });
    }

    return {
      pasteText,
      increasePrompt,
      decreasePrompt,
      resetPrompt,
    };
  };

  const copyToClipboardButton = (text) => {
    const id = `${Math.random()}-clipboard-svg`;
    const clipboardButton = document.createElement('div');
    clipboardButton.className = 'clipboard-button';
    clipboardButton.innerHTML = `<img id="${id}" src="assets/clipboard.svg" width="20" height="20">`;
    clipboardButton.title = 'Copy to clipboard';

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = 'Copied!';
    tooltip.style.visibility = 'hidden';
    clipboardButton.appendChild(tooltip);

    clipboardButton.addEventListener('click', function () {
      // Reset previous clipboard buttons
      const tooltips = document.getElementsByClassName('tooltip');
      for (const tooltip of tooltips) tooltip.style.visibility = 'hidden';
      const svgs = document.querySelectorAll('img[id$="-clipboard-svg"]');
      for (const svg of svgs) svg.src = 'assets/clipboard.svg';

      const textarea = document.createElement('textarea');
      textarea.value = text.trim();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      const svg = document.getElementById(`${id}`);
      svg.src = 'assets/tick.svg';
      tooltip.style.visibility = 'visible';
      setTimeout(function () {
        svg.src = 'assets/clipboard.svg';
        tooltip.style.visibility = 'hidden';
      }, 2000);
    });

    return clipboardButton;
  };

  async function createButton(
    buttonName,
    arg,
    container,
    functionInputParam = 'pasteText',
  ) {
    const buttonsContainer = document.createElement('div');

    const button = document.createElement('button');
    button.textContent = buttonName;
    if (functionInputParam === 'pasteText') {
      try {
        arg = await loadText(arg);
        button.title = arg.trim();
      } catch {
        buttonName = `ERROR: Could not load textfile ${arg}`;
      }
    }
    button.addEventListener('click', function () {
      const codeToExecute = `(${extensionContext})().${functionInputParam}${
        arg === '' ? '()' : `(${JSON.stringify(arg)})`
      }`;

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.executeScript(tabs[0].id, {
          code: codeToExecute,
        });
      });
    });
    buttonsContainer.appendChild(button);
    buttonsContainer.className = 'button-container';

    if (functionInputParam === 'pasteText') {
      const svgButton = copyToClipboardButton(arg);
      buttonsContainer.appendChild(svgButton);
    }

    container.appendChild(buttonsContainer);
  }

  const divDefault = document.createElement('div');
  createButton('Increase prompt size', '', divDefault, 'increasePrompt');
  const innerDiv = document.createElement('div');
  innerDiv.className = 'rowFlex';
  createButton('Decrease', '', innerDiv, 'decreasePrompt');
  createButton('Reset', '', innerDiv, 'resetPrompt');
  divDefault.appendChild(innerDiv);
  document.body.appendChild(divDefault);
  document.body.appendChild(document.createElement('hr'));

  const divCustom = document.createElement('div');
  const data = await fetch(
    chrome.runtime.getURL('custom-texts/textsConfig.json'),
  ).then((response) => response.json());
  for (const item of data) {
    await createButton(item.title, `custom-texts/${item.textfile}`, divCustom);
  }
  document.body.appendChild(divCustom);
};

main();
