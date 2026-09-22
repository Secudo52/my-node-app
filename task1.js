const Koa = require('koa');
const app = new Koa();

app.use(async ctx => {
    if (ctx.path === '/') {
        ctx.type = 'html';
        ctx.body = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>LR 15</title>
            </head>
            <body>
                <h1>Laboratornaya rabota №15</h1>
                <p>Student: Daniil Denishchik</p>
                <p>Gruppa: 477</p>
                <p>Data: ${new Date().toLocaleString('ru-RU')}</p>
                <p>Privetstvennoe soobshenie: Bazoviy server Koa.js uspeshno zapushen.</p>
            </body>
            </html>
        `;
    } else {
        ctx.status = 404;
        ctx.body = 'Not Found';
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zadanie 1: Server zapushen na http://localhost:${PORT}`);
});