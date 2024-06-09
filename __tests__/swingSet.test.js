const ss = require('../swingSet');

const timeSteps = [-100,11,-48,-42,39,-4,-35,-35,13,0,-17,42,31,44,15,24];
const noteId = 7;
const gridSpeed = 3;
const rndAmt = 0;
const rndSeed = -1;
const startTime = 1.75;
const ppqQuant = 5;
const offset = 65;
const quantOn1 = 1;
const notesArr = [
    { note_id: 7, start_time: 0.5, velocity: 50 },
    { note_id: 3, start_time: 0.5, velocity: 76 },
    { note_id: 15, start_time: 1.24, velocity: 43 },
];
const replaceNotesArr = [
    { start_time: 0.3333 },
    { start_time: 0.5432 },
    { start_time: 1.34 },
];
const timeCfg = { gridSpeed, rndAmt, rndSeed, ppqQuant, offset, quantOn1 };
const velSteps = [10,-24,58,28,114,-14,-102,42,11,25,-51,125,-106,86,-46,-30];
const velocity = 50;
const curve = 50;
const quantize = 3;
const velCfg = { gridSpeed, rndAmt, rndSeed, offset: -5, curve, quantize };
const propsObj = {
    timeSteps,
    velSteps,
    timeCfg,
    velCfg,
    capture: 0,
};

describe("swingSet", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('gets grid speed multiplier', () => {
        const response = ss.getGridSpeedMultiplier(6);
        expect(response).toEqual(0.5);
    });

    test('interpolates between two step values', () => {
        let noteGridPos = -0.643;
        let response = ss.interpolateSubStep({noteGridPos, steps: timeSteps});
        expect(response).toEqual(-20.267999999999915);
        noteGridPos = 3.294;
        response = ss.interpolateSubStep({noteGridPos, steps: timeSteps});
        expect(response).toEqual(-18.185999999999996);
        noteGridPos = 15.357;
        response = ss.interpolateSubStep({noteGridPos, steps: timeSteps});
        expect(response).toEqual(-20.267999999999915);
    });

    test('scales time adjustment by the grid speed', () => {
        const unscaledTimeAdj = 32.5;
        const factor = 100;
        const response = ss.scaleTimeAdj({unscaledTimeAdj, gridSpeed, factor});
        expect(response).toEqual(0.040625);
    });

    test('calculates a scaled time adjustment on grid of adjustments', () => {
        const response = ss.adjustByTimeSteps({startTime, timeSteps, gridSpeed});
        expect(response).toEqual(1.70625);
    });

    test('randomizes a value within a range', () => {
        const rndRange = 100;
        const response = ss.randomizeRangePercentage({rndAmt, rndSeed, rndRange, noteId});
        // Note this test is kind of useless due to the quirks of Max/MSP and es5 type importing of seedrandom.
        expect(Math.abs(response)).toEqual(0);
    });

    test('calculates a scaled random time adjustment', () => {
        const response = ss.adjustByRandomTime({startTime, rndAmt, rndSeed, gridSpeed, noteId});
        // Note this test is kind of useless due to the quirks of Max/MSP and es5 type importing of seedrandom.
        expect(response).toEqual(1.75);
    });

    test('calculates a scaled fixed time adjustment', () => {
        const response = ss.adjustByTimeOffset({startTime, offset, gridSpeed});
        expect(response).toEqual(1.83125);
    });

    test('quantizes timing based on a ppq index', () => {
        const startTime = 1.6743313691187331;
        const response = ss.quantizeTiming({startTime, ppqQuant});
        expect(response).toEqual(1.6770833333333333);
    });

    test('finds array of the first notes in a sequence', () => {
        const response = ss.findFirstStartNotes(notesArr);
        expect(response).toEqual([
            {index: 0, note_id: 7, start_time: 0.5, velocity: 50},
            {index: 1, note_id: 3, start_time: 0.5, velocity: 76}
        ]);
    });

    test('finds alignment offset required to align the offset sequence on the original first note time', () => {
        const firstStartNotes = [
            {index: 0, start_time: 0.5},
            {index: 1, start_time: 0.5}
        ];
    const response = ss.getFirstNotesAlignmentOffset({replaceNotesArr, firstStartNotes});
    expect(response).toEqual(-0.16670000000000001);
  });

  test('aligns modified timing array on the original first note timing', () => {
    const response = ss.alignOnFirstOne({notesArr, replaceNotesArr});
    expect(response).toEqual([
      {start_time: 0.5}, 
      {start_time: 0.7099}, 
      {start_time: 1.5067000000000002}
    ]);
  });

  test('adjusts timing based on array of timing adjustment steps and configuration', () => {
    const response = ss.adjustTiming({notesArr, timeSteps, timeCfg});
    expect(response).toEqual([
      {index: 0, note_id: 7, start_time: 0.5, velocity: 50}, 
      {index: 1, note_id: 3, start_time: 0.5, velocity: 76}, 
      {index: 2, note_id: 15, start_time: 1.3020833333333333, velocity: 43}
    ]);
  });

  test('calculates a scaled velocity adjustment on grid of adjustments', () => {
    const response = ss.adjustByVelocitySteps({velocity, startTime, velSteps, gridSpeed});
    expect(response).toEqual(92);
  });

  test('calculates a scaled random velocity adjustment', () => {
    const response = ss.adjustByRandomVelocity({velocity, rndAmt, rndSeed, noteId});
    // Note this test is kind of useless due to the quirks of Max/MSP and es5 type importing of seedrandom.
    expect(response).toEqual(50);
  });

  test('calculates a scaled fixed velocity adjustment', () => {
    const response = ss.adjustByVelocityOffset({velocity, offset});
    expect(response).toEqual(115);
  });

  test('calculates a scaled velocity curve adjustment', () => {
    const response = ss.adjustByVelocityCurve({velocity, curve});
    expect(response).toEqual(65.31496062992126);
  });

  test('quantizes velocity based on a 2 power index', () => {
    let response = ss.quantizeVelocity({velocity: 53, quantize: 0});
    expect(response).toEqual(53);
    response = ss.quantizeVelocity({velocity: 53, quantize: 1});
    expect(response).toEqual(54);
    response = ss.quantizeVelocity({velocity: 53, quantize: 2});
    expect(response).toEqual(52);
    response = ss.quantizeVelocity({velocity: 53, quantize: 3});
    expect(response).toEqual(56);
    response = ss.quantizeVelocity({velocity: 53, quantize: 4});
    expect(response).toEqual(48);
    response = ss.quantizeVelocity({velocity: 53, quantize: 5});
    expect(response).toEqual(64);
    response = ss.quantizeVelocity({velocity: 53, quantize: 6});
    expect(response).toEqual(64);
    response = ss.quantizeVelocity({velocity: 53, quantize: 7});
    expect(response).toEqual(0);
  });

  test('truncates velocity to be between 1 and 127', () => {
    let response = ss.truncateVelocity(50);
    expect(response).toEqual(50);
    response = ss.truncateVelocity(130);
    expect(response).toEqual(127);
    response = ss.truncateVelocity(-10);
    expect(response).toEqual(1);
});

  test('adjusts velocity based on array of velocity adjustment steps and configuration', () => {
    const response = ss.adjustVelocity({notesArr, velSteps, velCfg});
    expect(response).toEqual([
        {index: 0, note_id: 7, start_time: 0.5, velocity: 112}, 
        {index: 1, note_id: 3, start_time: 0.5, velocity: 127}, 
        {index: 2, note_id: 15, start_time: 1.24, velocity: 40}
    ]);
  });

  test('full transformation logic', () => {
    let response = ss.transformNotes({propsObj, notesArr});
    let outputObj = {
        notes: [
            {note_id: 7, start_time: 0.50, velocity: 112, index: 0}, 
            {note_id: 3, start_time: 0.5, velocity: 127, index: 1}, 
            {note_id: 15, start_time: 1.3020833333333333, velocity: 8, index: 2}
        ]
    };
    expect(response).toEqual(JSON.stringify(outputObj));
    let noQuantPropsObj = JSON.parse(JSON.stringify(propsObj));
    noQuantPropsObj = {
        ...noQuantPropsObj,
        timeCfg: {
            ...timeCfg,
            quantOn1: 0,
        }
    }
    const notesArrStart0 = [
        { note_id: 99, start_time: 0, velocity: 127 },
        { note_id: 7, start_time: 0.5, velocity: 50 },
        { note_id: 3, start_time: 0.5, velocity: 76 },
        { note_id: 15, start_time: 1.24, velocity: 43 },
    ];
    response = ss.transformNotes({propsObj: noQuantPropsObj, notesArr: notesArrStart0});
    outputObj = {
        notes: [
            {note_id: 99, start_time: -0.041666666666666664, velocity: 127}, 
            {note_id: 7, start_time: 0.5208333333333334, velocity: 112}, 
            {note_id: 3, start_time: 0.5208333333333334, velocity: 127}, 
            {note_id: 15, start_time: 1.3229166666666667, velocity: 1}
        ]
    };
    expect(response).toEqual(JSON.stringify(outputObj));
  });

  test('average an array of numbers', () => {
    const numberArray = [1, 2, 3, 4, 5];
    const response = ss.averageArray(numberArray);
    expect(response).toEqual(3);
  });

  test('performs a weighted average an array of objecs', () => {
    const objArray = [
        {num: 2, den: 2},
        {num: 6, den: 3},
        {num: 12, den: 4},
        {num: 12, den: 3},
        {num: 10, den: 2},
    ];
    const response = ss.weightedAverageArray(objArray);
    expect(response).toEqual(3);
  });

  test('performs a capture of offsets', () => {

    const eightNoteArr = [
        {start_time: 0.023958333333333, velocity: 70},
        {start_time: 0.476041666666667, velocity: 58},
        {start_time: 1.00625, velocity: 40},
        {start_time: 1.521875, velocity: 83},
        {start_time: 2.009375, velocity: 47},
        {start_time: 2.475, velocity: 78},
        {start_time: 2.964583333333333, velocity: 35},
        {start_time: 3.484375, velocity: 95}
    ];

    const response = ss.calculateNoteOffsets({propsObj, notesArr: eightNoteArr});
    expect(response).toEqual({
        capturedTime: [23, 4, -15, 4, 9, 4, 22, 4, 11, 4, -16, 4, -24, 4, -8, 4],
        capturedVel: [7, 0, -5, 0, -23, 0, 20, 0, -16, 0, 15, 0, -28, 0, 32, 0],
    });
  });
});
