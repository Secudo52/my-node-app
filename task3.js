const EventEmitter = require('events');

class DatabaseConnection extends EventEmitter {
    constructor(dbName) {
        super();
        this.dbName = dbName;
        this.connected = false;
    }

    connect() {
        console.log('[EVENT] Podklyuchenie k BD...');
        this.connected = true;
        this.emit('connect');
    }

    query(sql) {
        console.log(`[EVENT] Vipolnenie zaprosa: ${sql}`);
        let result;
        if (sql.includes('SELECT')) {
            result = '50 zapisey';
        } else if (sql.includes('INSERT')) {
            result = '1 zapis dobavlena';
        } else {
            result = 'uspeshno';
        }
        this.emit('query', sql, result);
    }

    close() {
        console.log('[EVENT] Zakritie soedineniya');
        this.connected = false;
        this.emit('close');
    }

    triggerError(errMsg) {
        this.emit('error', new Error(errMsg));
    }
}

function runDemo() {
    console.log('=== DatabaseConnection (gruppa 477) ===');

    const db = new DatabaseConnection('main_db');

    db.on('connect', () => {
        console.log('[EVENT] Soedinenie ustanovleno');
    });

    db.on('query', (sql, result) => {
        console.log(`[EVENT] Rezultat: ${result}`);
    });

    db.on('close', () => {
        console.log('[EVENT] Soedinenie zakrito');
    });

    db.on('error', (err) => {
        console.log(`[EVENT] Oshibka: ${err.message}`);
    });

    db.connect();
    db.query('SELECT * FROM students');
    db.query('INSERT INTO students');
    db.close();

    console.log('\n=== Demonstraciya oshibki ===');
    db.triggerError('Connection timeout');
}

if (process.argv.includes('--crash')) {
    const dbUncaught = new DatabaseConnection('fail_db');
    dbUncaught.triggerError('Unhandled connection error');
} else {
    runDemo();
}

module.exports = DatabaseConnection;
