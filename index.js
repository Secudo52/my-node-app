const http = require('http');

const STUDENT_NAME = 'Denishchik Daniil Dmitrievich';
const STUDENT_GROUP = 'Gryppa 477';
const JOURNAL_NUMBER = 7;

function calculatePi(digits) {
  let pi = 3.0;
  let sign = 1;
  for (let i = 2; i < 400000; i += 2) {
    pi += sign * (4 / (i * (i + 1) * (i + 2)));
    sign = -sign;
  }
  return pi.toFixed(digits);
}

const piValue = calculatePi(JOURNAL_NUMBER);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(\
    <p>\</p>
    <p>\</p>
    <p>         (      : \): \</p>
  \);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(\                  http://localhost:\\);
});
