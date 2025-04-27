const fs = require('fs');
const fetch = require('node-fetch');

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const pr = process.env.PR_NUMBER;

const [owner, repoName] = repo.split('/');
const report = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));

const commentOnPR = async (comment, path, line) => {
  const url = `https://api.github.com/repos/${owner}/${repoName}/pulls/${pr}/comments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      body: comment,
      path: path,
      line: line,
      side: 'RIGHT',
    }),
  });

  const result = await res.json();
  if (!res.ok) {
    console.error('Failed to post comment:', result.message);
  } else {
    console.log('Comment posted:', result.html_url);
  }
};

(async () => {
  for (const file of report) {
    const path = file.filePath.replace(`${process.cwd()}/`, '');
    for (const message of file.messages) {
      if (message.severity === 2) { // Only errors
        const line = message.line;
        const body = `🛑 ESLint Error: **${message.message}**\n\nRule: \`${message.ruleId}\``;
        await commentOnPR(body, path, line);
      }
    }
  }
})();