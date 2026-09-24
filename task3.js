const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = {
            error: err.message || 'Vnutrennyaya oshibka servera',
            status: ctx.status
        };
    }
});

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    
    console.log(`[${formattedDate}] ${ctx.method} ${ctx.path} - ${ms}ms`);
});

const checkAuth = async (ctx, next) => {
    if (!ctx.headers.authorization) {
        ctx.throw(401, 'Otsutstvuet zagolovok Authorization');
    }
    await next();
};

router.get('/protected', checkAuth, (ctx) => {
    ctx.body = { message: 'Dostup k zashishennomu marshrutu razreshen' };
});

router.get('/error', (ctx) => {
    throw new Error('Testovaya oshibka dlya proverki middleware');
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zadanie 3: Server zapushen na http://localhost:${PORT}`);
});