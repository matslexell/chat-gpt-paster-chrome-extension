var minimal = `Hi ChatGPT,
I have a coding problem that I need your assistance with. I'm going to provide a description of the issue and a relevant code block for context. Please only suggest the minimal changes necessary to address the problem instead of rewriting the whole code block. To clarify: You usually give verbose examples where you rewrite a lot of code, even parts that doesn't require edits: I DO NOT WANT YOU TO DO THIS, Please provide the smallest possible change to fix the issue I'm about to describe.

Here's the issue:

[description]

And here's the code block:

\`\`\`
[codeblock]
\`\`\`

Thanks for your help!`;

document.getElementById('minimal').addEventListener('click', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.executeScript(tabs[0].id, {
      code: `document.getElementById("prompt-textarea").value = "${minimal.replace(/\n/g, '\\n')}"`,
    });
  });
});
