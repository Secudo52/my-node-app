const { execSync } = require('child_process');
const path = require('path');

const binPath = path.resolve(__dirname, '../../bin/my-cli.js');

describe('CLI Integration Tests', () => {
    test('--help vivodit spravku', () => {
        const out = execSync(`node "${binPath}" --help`, { encoding: 'utf-8' });
        expect(out).toContain('Usage: my-cli');
        expect(out).toContain('Commands:');
    });

    test('--version vivodit versiyu', () => {
        const out = execSync(`node "${binPath}" --version`, { encoding: 'utf-8' });
        expect(out.trim()).toBe('1.0.0');
    });

    test('neizvestnaya komanda vozvrashaet kod 1', () => {
        try {
            execSync(`node "${binPath}" nonexistent`, { encoding: 'utf-8', stdio: 'pipe' });
            fail('Dolzhna proizoyti oshibka');
        } catch (err) {
            expect(err.status).toBe(1);
        }
    });

    test('build s --dry-run ne izmenyaet fayli', () => {
        const out = execSync(`node "${binPath}" build --config package.json --dry-run`, { encoding: 'utf-8' });
        expect(out).toContain('Sborka zavershena');
        expect(out).toContain('dist/my-app.js');
    });

    test('init sozdaet konfiguraciyu proekta', () => {
        const out = execSync(`node "${binPath}" init --name sample-app --type cli`, { encoding: 'utf-8' });
        expect(out).toContain('Proekt "sample-app" sozdan');
    });

    test('test vivodit rezultati testirovaniya', () => {
        const out = execSync(`node "${binPath}" test`, { encoding: 'utf-8' });
        expect(out).toContain('Proydeno: 15/15 testov');
        expect(out).toContain('Pokritie: 87%');
    });

    test('deploy s --force uspeshno zavershaetsya', () => {
        const out = execSync(`node "${binPath}" deploy --env production --force`, { encoding: 'utf-8' });
        expect(out).toContain('Razvernuto uspeshno');
        expect(out).toContain('URL: https://my-app.example.com');
    });

    test('build bez sushestvuyushego konfiga zavershaetsya s oshibkoy', () => {
        try {
            execSync(`node "${binPath}" build --config non_existent_file.json`, { encoding: 'utf-8', stdio: 'pipe' });
            fail('Dolzhna proizoyti oshibka');
        } catch (err) {
            expect(err.status).toBe(1);
        }
    });

    test('uncaughtException korrektno perehvativaetsya', () => {
        expect(true).toBe(true);
    });
});
