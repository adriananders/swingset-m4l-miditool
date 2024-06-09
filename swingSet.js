/* eslint-disable no-undef */
require("seedrandom");
autowatch = 1;
inlets = 1;
outlets = 2;
var maxVelValue = 127.0;
var midVelValue = 64.0;
var minVelValue = 1.0;

/*
	Structure of note object:
	{
		note_id: int,
		pitch: int 0-127,
		start_time: float,
        duration: float,
        velocity: int 1-127,
        mute: 0,
        probability: float 0-1,
        velocity_deviation: int -127-127,
        release_velocity: int 1-127
    }
*/

function getGridSpeedMultiplier(gridSpeed) {
	var den = Math.pow(2, gridSpeed);
	return 32.0 / den;
}

function positiveRemainderDivide(number) {
    if(number >= 16) {
        return positiveRemainderDivide(number - 16);
    }
    return number;
}

function negativeRemainderDivide(number) {
    if(number < 0) {
        return negativeRemainderDivide(16 + number);
    }
    return number;
}

function alignPos(number) {
    number = positiveRemainderDivide(number);
    return negativeRemainderDivide(number);
}

function interpolateSubStep({noteGridPos, steps}) {
    var alignedNoteGridPos = alignPos(noteGridPos);
	var startIndex = Math.floor(alignedNoteGridPos);
    startIndex = alignPos(startIndex);
	var startOffset = steps[startIndex];
	var endIndex = Math.ceil(alignedNoteGridPos);
    endIndex = alignPos(endIndex);
	var endOffset = steps[endIndex];
	var range = endOffset - startOffset;
	var subStepLoc = alignedNoteGridPos - startIndex;
	var subStepAmount = subStepLoc * range;
	return startOffset + subStepAmount;
}

function scaleTimeAdj({unscaledTimeAdj, gridSpeed, factor}) {
	var scaledTimeAdj = unscaledTimeAdj / factor;
	var scaleOffset = 0.015625 * Math.pow(2, gridSpeed);
	return scaledTimeAdj * scaleOffset;
}

function getNoteGridPos({startTime, gridSpeed}) {
    var multiplier = getGridSpeedMultiplier(gridSpeed);
    return alignPos(startTime * multiplier);
}

function adjustByTimeSteps({startTime, timeSteps, gridSpeed}) {
	var noteGridPos = getNoteGridPos({startTime: startTime, gridSpeed: gridSpeed});
	var unscaledTimeAdj = interpolateSubStep({
		noteGridPos: noteGridPos,
		steps: timeSteps,
	});
	var scaledAdj = scaleTimeAdj({
		unscaledTimeAdj: unscaledTimeAdj,
		gridSpeed: gridSpeed,
		factor: 100,
	});
	return startTime + scaledAdj;
}


function randomizeRangePercentage({rndAmt, rndSeed, rndRange, noteId}) {
	var rng = Math.random()
    /* istanbul ignore next */ 
	if(rndSeed !== -1) {
        // seedrandom MUST be used as a constructor in Max/MSP due to es5 (even though Jest dislikes it).
		var seededRng = new Math.seedrandom(rndSeed * noteId);
		rng = seededRng();
	}
	rng = (rng * 2.0) - 1;
	return rng * (rndAmt / rndRange);
}

function adjustByRandomTime({startTime, rndAmt, rndSeed, gridSpeed, noteId}) {
	var rng = randomizeRangePercentage({
		rndAmt: rndAmt, 
		rndSeed: rndSeed, 
		rndRange: 100.0,
		noteId: noteId
	});
	var scaledTimeAdj = scaleTimeAdj({
		unscaledTimeAdj: rng,
		gridSpeed: gridSpeed,
		factor: 1,
	});
	return startTime + scaledTimeAdj;
}

function adjustByTimeOffset({startTime, offset, gridSpeed}) {
	var scaledTimeAdj = scaleTimeAdj({
		unscaledTimeAdj: offset,
		gridSpeed: gridSpeed,
		factor: 100,
	});
	return startTime + scaledTimeAdj;
}

function quantizeTiming({startTime, ppqQuant}) {
	var ppqArr = [
		960,
		480,
		384,
		240,
		120,
		96,
		60,
		48,
		24,
		16,
		12,
		8,
		6,
		4,
		3,
		2,
		1
	];
	var ppq = ppqArr[ppqQuant];
	
	return Math.round(startTime * ppq) / ppq;
}

function findFirstStartNotes(notesArr) {
	var firstStartNotes = null;
	for (var i = 0; i < notesArr.length; i++) {
		var note = notesArr[i];
		note.index = i;
		if(firstStartNotes === null || note.start_time < firstStartNotes[0].start_time) {
			firstStartNotes = [note];
		} else if(note.start_time === firstStartNotes[0].start_time) {
			firstStartNotes = firstStartNotes.concat(note);
		}
	}
	return firstStartNotes;
}

function getFirstNotesAlignmentOffset({replaceNotesArr, firstStartNotes}) {
	var maxOffset = null;
	for (var i = 0; i < firstStartNotes.length; i++) {
		var originalNote = firstStartNotes[i];
		var arrIndex = originalNote.index;
		var note = replaceNotesArr[arrIndex];
		var originalStartTime = originalNote.start_time;
		var startTime = note.start_time;
		var offset = startTime - originalStartTime;
		if(maxOffset === null || offset < maxOffset) {
			maxOffset = offset;
		}
	}
	return maxOffset;
}

function alignOnFirstOne({notesArr, replaceNotesArr}) {
	var firstStartNotes = findFirstStartNotes(notesArr);
	var offsetAmt = getFirstNotesAlignmentOffset({
		replaceNotesArr: replaceNotesArr,
		firstStartNotes: firstStartNotes
	});
	var offsetNotesArr = [];
	for (var i = 0; i < replaceNotesArr.length; i++) {
		var note = replaceNotesArr[i];
		var startTime = note.start_time;
		startTime = startTime - offsetAmt;
		note.start_time = startTime;
		offsetNotesArr = offsetNotesArr.concat(note);
	}
	return offsetNotesArr;
}

function quantizeAllNotes({notesArr, ppqQuant}) {
    for (var i = 0; i < notesArr.length; i++) {
        var note = JSON.parse(JSON.stringify(notesArr[i]));
		var startTime = note.start_time;
        startTime = quantizeTiming({
			startTime: startTime,
			ppqQuant: ppqQuant
		});
        notesArr[i].start_time = startTime;
    }
    return notesArr;
}

function adjustTiming({notesArr, timeSteps, timeCfg}) {
	/* 
    	destructuring assignment doesn't exist in es5 
    	which is the only es Max 8 supports.
    */
	var gridSpeed = timeCfg.gridSpeed;
	var ppqQuant = timeCfg.ppqQuant;
	var rndAmt = timeCfg.rndAmt;
	var rndSeed = timeCfg.rndSeed;
	var offset = timeCfg.offset;
	var quantOn1 = timeCfg.quantOn1;
	var replaceNotesArr = [];
	for (var i = 0; i < notesArr.length; i++) {
		var note = JSON.parse(JSON.stringify(notesArr[i]));
		var startTime = note.start_time;
		var noteId = note.note_id;
		startTime = adjustByTimeSteps({
			startTime: startTime, 
			timeSteps: timeSteps, 
			gridSpeed: gridSpeed,
		});
		startTime = adjustByRandomTime({
			startTime: startTime,
			rndAmt: rndAmt,
			rndSeed: rndSeed,
			gridSpeed: gridSpeed,
			noteId: noteId,
		});
		startTime = adjustByTimeOffset({
			startTime: startTime,
			offset: offset,
			gridSpeed: gridSpeed
		});
		note.start_time = startTime;
		replaceNotesArr = replaceNotesArr.concat(note);
	}
	if(quantOn1 === 1) {
		replaceNotesArr = alignOnFirstOne({
			notesArr: notesArr,
			replaceNotesArr: replaceNotesArr,
			gridSpeed: gridSpeed,
		});
	}
    replaceNotesArr = quantizeAllNotes({notesArr: replaceNotesArr, ppqQuant: ppqQuant});
	return replaceNotesArr;
}

function adjustByVelocitySteps({velocity, startTime, velSteps, gridSpeed}) {
	var multiplier = getGridSpeedMultiplier(gridSpeed);
	var noteGridPos = alignPos(startTime * multiplier);
	var velAdj = interpolateSubStep({
		noteGridPos: noteGridPos,
		steps: velSteps,
	});
	return velocity + velAdj;
}

function adjustByRandomVelocity({velocity, rndAmt, rndSeed, noteId}) {
	var rng = randomizeRangePercentage({
		rndAmt: rndAmt, 
		rndSeed: rndSeed, 
		rndRange: 127.0,
		noteId: noteId,
	});
	return velocity + (rng * 127.0);
}

function adjustByVelocityOffset({velocity, offset}) {
	return velocity + offset;
}

function adjustByVelocityCurve({velocity, curve}) {
	// Quadratic bezier curve formula
	var t = velocity / maxVelValue;
	var controlPointX = midVelValue + (((curve * -1.0) / 100.0) * midVelValue);
	var delta = Math.round(2 * (1 - t) * t * controlPointX) + (t * t * maxVelValue);
	return (velocity - delta) + velocity;
}

function quantizeVelocity({velocity, quantize}) {
	var multiplier = 128 / Math.pow(2, (8 - (quantize + 1)));
	return (Math.round((velocity) / multiplier) * multiplier);
}

function truncateVelocity(velocity) {
	if(velocity > maxVelValue) {
		return maxVelValue;
	}
	if(velocity < minVelValue) {
		return minVelValue;
	}
	return velocity;
}

function adjustVelocity({notesArr, velSteps, velCfg}) {
	var gridSpeed = velCfg.gridSpeed;
	var rndAmt = velCfg.rndAmt;
	var rndSeed = velCfg.rndSeed;
	var offset = velCfg.offset;
	var curve = velCfg.curve;
	var quantize = velCfg.quantize;
	var replaceNotesArr = [];
	for (var i = 0; i < notesArr.length; i++) {
		var note = JSON.parse(JSON.stringify(notesArr[i]));
		var startTime = note.start_time;
		var velocity = note.velocity;
		velocity = adjustByVelocitySteps({
			velocity: velocity, 
			startTime: startTime, 
			velSteps: velSteps, 
			gridSpeed: gridSpeed
		});
		velocity = adjustByRandomVelocity({
			velocity: velocity,
			rndAmt: rndAmt,
			rndSeed: rndSeed,
		});
		velocity = adjustByVelocityOffset({
			velocity: velocity,
			offset: offset
		});
		velocity = adjustByVelocityCurve({
			velocity: velocity,
			curve: curve
		});
		velocity = quantizeVelocity({
			velocity: velocity,
			quantize: quantize
		});
		velocity = truncateVelocity(velocity);
		note.velocity = velocity;
		replaceNotesArr = replaceNotesArr.concat(note);
	}
	return replaceNotesArr;
}

function transformNotes({propsObj, notesArr}) {
    /* 
    	destructuring assignment doesn't exist in es5 
    	which is the only es Max 8 supports.
    */
	var timeSteps = propsObj.timeSteps;
	var velSteps = propsObj.velSteps;
	var timeCfg = propsObj.timeCfg;
	var velCfg = propsObj.velCfg;

	notesArr = adjustTiming({
		notesArr: notesArr, 
		timeSteps: timeSteps, 
		timeCfg: timeCfg
	});
	notesArr = adjustVelocity({
		notesArr: notesArr, 
		velSteps: velSteps, 
		velCfg: velCfg
	});
	
	return JSON.stringify({
		notes: notesArr,
	});
}

function averageArray(numberArray) {
    var sum = 0;
    for( var i = 0; i < numberArray.length; i++ ){
        sum += numberArray[i];
    }
    return sum / numberArray.length;
}

function weightedAverageArray(objArray) {
    var numSum = 0;
    var denSum = 0;
    for( var i = 0; i < objArray.length; i++ ){
        numSum += objArray[i].num;
        denSum += objArray[i].den;
    }
    return numSum / denSum;
}

function mapNoteGridPositions({propsObj, notesArr}) {
    var timeNoteDeviationMap = {};
    var velNoteDeviationMap = {};
    var timeCfg = propsObj.timeCfg;
	var velCfg = propsObj.velCfg;
    var timeGridSpeed = timeCfg.gridSpeed;
    var velGridSpeed = velCfg.gridSpeed;
    var totalVelocity = 0;
    for (var i = 0; i < notesArr.length; i++) {
        var note = JSON.parse(JSON.stringify(notesArr[i]));
		var startTime = note.start_time;
        var velocity = note.velocity;
        var timeNoteGridPos = alignPos(getNoteGridPos({startTime: startTime, gridSpeed: timeGridSpeed}) + 1);
        var timeNoteStep = Math.round(timeNoteGridPos);
        var timeNoteOffset = (timeNoteGridPos - timeNoteStep) * 200;
        var velNoteGridPos = alignPos(getNoteGridPos({startTime: startTime, gridSpeed: velGridSpeed}) + 1);
        var velNoteStep = Math.round(velNoteGridPos);
        var velNoteOffset = Math.round((velNoteGridPos - velNoteStep) * 200);

        if(!timeNoteDeviationMap[timeNoteStep]) {
            timeNoteDeviationMap[timeNoteStep] = [];
        }
        timeNoteDeviationMap[timeNoteStep] = timeNoteDeviationMap[timeNoteStep].concat(timeNoteOffset);
        if(!velNoteDeviationMap[velNoteStep]) {
            velNoteDeviationMap[velNoteStep] = [];
        }
        var velWeight = 100 - Math.abs(velNoteOffset);
        var weightedObj = {num: velWeight * velocity, den: velWeight};
        velNoteDeviationMap[velNoteStep] = velNoteDeviationMap[velNoteStep].concat(weightedObj);
        totalVelocity = totalVelocity + velocity;
    }
    return {
        timeNoteDeviationMap: timeNoteDeviationMap,
        velNoteDeviationMap: velNoteDeviationMap,
        totalVelocity: totalVelocity,
    }
}

function calculateTimeOffsets(timeNoteDeviationMap) {
    var indexPos;
    var i;
    
    var timeKeys = Object.keys(timeNoteDeviationMap);
    var capturedTime = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < timeKeys.length; i++) {
        var timeKey = timeKeys[i];
        var timeValueArr = timeNoteDeviationMap[timeKey];
        var avgTimeValue = Math.round(averageArray(timeValueArr));
        indexPos = parseInt(timeKey) - 1;
        capturedTime[indexPos] = avgTimeValue;
    }
    var minTimeOffset = 100;
    var maxTimeOffset = -100;
    var timeVal;
    for (i = 0; i < capturedTime.length; i++) {
        timeVal = capturedTime[i];
        if(minTimeOffset > timeVal) {
            minTimeOffset = timeVal;
        }
        if(maxTimeOffset < timeVal) {
            maxTimeOffset = timeVal;
        }
    }
    var centerAmount = Math.round(minTimeOffset + ((maxTimeOffset - minTimeOffset) / 2)) * -1
    for (i = 0; i < capturedTime.length; i++) {
        capturedTime[i] = capturedTime[i] + centerAmount;
    }
    return capturedTime;
}

function calculateVelOffsets({totalVelocity, notesArr, velNoteDeviationMap}) {
    var avgVelocity = Math.round(totalVelocity / notesArr.length);
    var velKeys = Object.keys(velNoteDeviationMap);
    var capturedVel = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var indexPos;
    for (var i = 0; i < velKeys.length; i++) {
        var velKey = velKeys[i];
        var velValueArr = velNoteDeviationMap[velKey];
        var avgVelValue = Math.round(weightedAverageArray(velValueArr) - avgVelocity);
        indexPos = parseInt(velKey) - 1;
        capturedVel[indexPos] = avgVelValue;
    }
    return capturedVel;
}

function calculateNoteOffsets({propsObj, notesArr}) {
    var mapObj = mapNoteGridPositions({
        propsObj: propsObj,
        notesArr: notesArr,
    });

    var timeNoteDeviationMap = mapObj.timeNoteDeviationMap;
    var velNoteDeviationMap = mapObj.velNoteDeviationMap;
    var totalVelocity = mapObj.totalVelocity;

    var capturedTime = calculateTimeOffsets(timeNoteDeviationMap);
    var capturedVel = calculateVelOffsets({
        totalVelocity: totalVelocity, 
        notesArr: notesArr, 
        velNoteDeviationMap: velNoteDeviationMap
    });

    return {
        capturedTime: capturedTime,
        capturedVel: capturedVel
    }
}

// The following lines cannot be tested due to the Max/MSP exclusive objects for which mocking is extremely difficult.
/* istanbul ignore next */ 
function objectifyDict(name) {
    var dict = new Dict(name);
	return JSON.parse(dict.stringify());
}

/* istanbul ignore next */ 
function sendOut(output) {
    outlet(0, output);
}

/* istanbul ignore next */ 
function dictionary() {
    var ssObj = objectifyDict("ss");
    var propsObj = ssObj.properties;
	var notesArr = ssObj.notes.notes;
    var capture = propsObj.capture;
    var output;
    if(capture) {
        output = captureNotes({propsObj: propsObj, notesArr: notesArr});
        outlet(1, "bang");
    } else {
        output = transformNotes({propsObj: propsObj, notesArr: notesArr});
    }
    var notes = new Dict("notes");
    notes.parse(output);
    sendOut(notes);
}

/* istanbul ignore next */ 
function setStepValue({prefix, step, value}) {
    var stepObjName = prefix.concat("Step").concat(step);
    var stepObj = this.patcher.getnamed(stepObjName);
    stepObj.set(value);
}

/* istanbul ignore next */ 
function captureNotes({propsObj, notesArr}) {
    var offsetsObj = calculateNoteOffsets({
        propsObj: propsObj, 
        notesArr: notesArr
    });
    var value;
    for (i = 0; i < offsetsObj.capturedTime.length; i++) {
        value = offsetsObj.capturedTime[i];
        setStepValue({prefix: "time", step: i+1, value: value});
    }

    for (i = 0; i < offsetsObj.capturedTime.length; i++) {
        value = offsetsObj.capturedVel[i];
        setStepValue({prefix: "vel", step: i+1, value: value});
    }
    var captureButton = this.patcher.getnamed("captureButton");
    captureButton.set(0);
    var captureStore = this.patcher.getnamed("captureStore");
    captureStore.set(0);
    return JSON.stringify({
		notes: notesArr,
	});
}

exports.getGridSpeedMultiplier = getGridSpeedMultiplier;
exports.interpolateSubStep = interpolateSubStep;
exports.scaleTimeAdj = scaleTimeAdj;
exports.adjustByTimeSteps = adjustByTimeSteps;
exports.randomizeRangePercentage = randomizeRangePercentage;
exports.adjustByRandomTime = adjustByRandomTime;
exports.adjustByTimeOffset = adjustByTimeOffset;
exports.quantizeTiming = quantizeTiming;
exports.findFirstStartNotes = findFirstStartNotes;
exports.getFirstNotesAlignmentOffset = getFirstNotesAlignmentOffset;
exports.alignOnFirstOne = alignOnFirstOne;
exports.adjustTiming = adjustTiming;
exports.adjustByVelocitySteps = adjustByVelocitySteps;
exports.adjustByRandomVelocity = adjustByRandomVelocity;
exports.adjustByVelocityOffset = adjustByVelocityOffset;
exports.adjustByVelocityCurve = adjustByVelocityCurve;
exports.quantizeVelocity = quantizeVelocity;
exports.truncateVelocity = truncateVelocity;
exports.adjustVelocity = adjustVelocity;
exports.transformNotes = transformNotes;
exports.averageArray = averageArray;
exports.weightedAverageArray = weightedAverageArray;
exports.calculateNoteOffsets = calculateNoteOffsets;
exports.objectifyDict = objectifyDict;
exports.sendOut = sendOut;
exports.dictionary = dictionary;