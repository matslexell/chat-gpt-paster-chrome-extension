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

    function copyToClipboard(text) {
      const tempInput = document.createElement('textarea');
      tempInput.style = 'position: absolute; left: -1000px; top: -1000px';
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }
    return {
      pasteText,
      copyToClipboard,
      increasePrompt,
      decreasePrompt,
      resetPrompt,
    };
  };

  let functionSetByCheckbox = 'pasteText';
  async function createButton(text, arg, container, functionInputParam) {
    if (arg.endsWith('txt')) {
      try {
        arg = await loadText(arg);
      } catch {
        text = `ERROR: Could not load textfile ${arg}`;
      }
    }
    const button = document.createElement('button');
    button.textContent = text;
    container.appendChild(button);
    button.addEventListener('click', function () {
      fun = functionInputParam || functionSetByCheckbox;
      if (fun === 'copyToClipboard') {
        const label = document.getElementById('copyToClipboard');
        label.textContent = 'Text copied!';
        setTimeout(function () {
          label.textContent = 'Copy to clipboard';
        }, 2000);
      }
      const codeToExecute = `(${extensionContext})().${fun}${
        arg === '' ? '()' : `(${JSON.stringify(arg)})`
      }`;

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.executeScript(tabs[0].id, {
          code: codeToExecute,
        });
      });
    });
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

  const createCheckboxes = () => {
    let allCheckboxes = [];
    function createCheckBox(text, container, id) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      const label = document.createElement('label');
      label.id = id;
      label.appendChild(document.createTextNode(text));
      container.appendChild(checkbox);
      container.appendChild(label);

      checkbox.addEventListener('change', function () {
        if (this.checked) {
          allCheckboxes.forEach((item) => {
            if (item !== this) item.checked = false;
          });
          functionSetByCheckbox = id;
        }
      });
      allCheckboxes.push(checkbox);
    }
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'rowFlex';
    createCheckBox('Paste to prompt', checkboxDiv, 'pasteText');
    createCheckBox('Copy to clipboard', checkboxDiv, 'copyToClipboard');
    document.body.appendChild(checkboxDiv);
    allCheckboxes[0].checked = true;
  };
  createCheckboxes();

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
