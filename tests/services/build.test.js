const ProjectService = require('../../services/projectService');

describe('ProjectService Unit Tests', () => {
    test('init creates project info with default cli type', () => {
        const res = ProjectService.init('test-project');
        expect(res.name).toBe('test-project');
        expect(res.type).toBe('cli');
        expect(res.success).toBe(true);
    });

    test('init throws error if name is empty', () => {
        expect(() => ProjectService.init('')).toThrow('Imya proekta ne ukazano');
    });

    test('test returns summary of tests and coverage', () => {
        const res = ProjectService.test();
        expect(res.passed).toBe(15);
        expect(res.total).toBe(15);
        expect(res.coverage).toBe('87%');
    });

    test('deploy to staging succeeds without confirmation', () => {
        const res = ProjectService.deploy('staging');
        expect(res.success).toBe(true);
        expect(res.url).toBe('https://my-app.example.com');
    });

    test('deploy to production requires confirmation if not forced', () => {
        const res = ProjectService.deploy('production', false);
        expect(res.requireConfirmation).toBe(true);
    });

    test('deploy to production succeeds when forced', () => {
        const res = ProjectService.deploy('production', true);
        expect(res.success).toBe(true);
    });
});
