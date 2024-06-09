const ui = require('../uiHandler');

describe("uiHandler", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('get list of steps objects names', () => {
        const response = ui.getStepsObj({
            prefix: "test",
            stepsLen: 2
        });
        expect(response).toEqual([
            "testStep1", 
            "testStep2", 
            "testLabel1", 
            "testLabel2"
        ]);
    });
});
