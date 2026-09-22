const Koa = require('koa');
const Router = require('@koa/router');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

app.use(bodyParser());

let users = [
    { id: 1, name: "Daniil Denishchik", group: "477" }
];
let nextId = 2;

router.get('/api/users', (ctx) => {
    ctx.body = users;
});

router.post('/api/users', (ctx) => {
    const { name, group } = ctx.request.body;
    if (!name || !group) {
        ctx.status = 400;
        ctx.body = { error: "Nevarnye dannye (Bad Request)" };
        return;
    }
    const newUser = { id: nextId++, name, group };
    users.push(newUser);
    ctx.status = 201; 
    ctx.body = newUser;
});

router.put('/api/users/:id', (ctx) => {
    const id = parseInt(ctx.params.id);
    const { name, group } = ctx.request.body;
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        ctx.status = 404;
        ctx.body = { error: "Polzovatel ne nayden" };
        return;
    }

    if (!name || !group) {
        ctx.status = 400;
        ctx.body = { error: "Nevarnye dannye (Bad Request)" };
        return;
    }

    users[index] = { id, name, group };
    ctx.body = users[index];
});

router.delete('/api/users/:id', (ctx) => {
    const id = parseInt(ctx.params.id);
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        ctx.status = 404;
        ctx.body = { error: "Polzovatel ne nayden" };
        return;
    }

    users.splice(index, 1);
    ctx.body = { message: "Uspeshno udaleno" };
});

app.use(router.routes()).use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Zadanie 2: REST API zapusheno na http://localhost:${PORT}`);
});