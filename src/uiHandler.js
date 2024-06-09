/* eslint-disable no-undef, no-unused-vars */
autowatch = 1;
inlets = 1;
outlets = 1;

var presetObj = {
	timeSteps: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	velSteps: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	timeCfg: {
		timeGridSpeed: 0,
		timePpqQuant: 0,
		timeRndAmt: 0.0,
		timeRndSeed: 0.0,
		timeOffset: 0.0,
		timeQuantOn1: 0
	},
	velCfg: {
	    velOffset: 0.0,
		velCurve: 0.0,
		velQuantize: 0,
		velRndAmt: 0.0,
		velRndSeed: 0.0,
		velGridSpeed: 0
	}
}

var timeSettingsControls = [
    "timeGridSpeed",
    "timePpqQuant",
    "timeRndAmt",
    "timeRndSeed",
    "timeOffset",
    "timeQuantOn1",
]

var timeSettingsObj = [
	"timeGridSpeedLabel",
	"timePpqQuantLabel",
	"timeRndAmtLabel",
	"timeRndSeedLabel",
	"timeOffsetLabel",
	"timeQuantOn1Label",
].concat(timeSettingsControls);

var velSettingsControls = [
    "velOffset",
    "velCurve",
    "velQuantize",
    "velRndAmt",
    "velRndSeed",
    "velGridSpeed",
];

var velSettingsObj = [
	"velOffsetLabel",
	"velCurveLabel",
	"velQuantizeLabel",
	"velRndAmtLabel",
	"velRndSeedLabel",
	"velGridSpeedLabel",
].concat(velSettingsControls);

var stepsLen = 16;

function getStepsObj({prefix, stepsLen, stepOnly}) {
	var stepObj = [];
	var labelObj = [];
	for (var i = 1; i <= stepsLen; i++) {
		stepObj.push(prefix.concat("Step").concat(i));
        if(!stepOnly) {
            labelObj.push(prefix.concat("Label").concat(i));
        }
	}
	return stepObj.concat(labelObj);
}

// view = 0 => Time
// view = 1 => Velocity
// view = 2 => Time Settings
// view = 3 => Velocity Settings

// The following lines cannot be tested due to the Max/MSP exclusive objects for which mocking is extremely difficult.

/* istanbul ignore next */ 
function getNamed(name) {
	return this.patcher.getnamed(name);
}

// shows or hides max ui objects
/* istanbul ignore next */ 
function showHideObjects({objArray, hide}) {
	for (var i = 0; i < objArray.length; i++) {
		getNamed(objArray[i]).hidden = hide;
	}
}

/* istanbul ignore next */ 
function setObject({objName, value}) {
    getNamed(objName).set(value);
}

/* istanbul ignore next */ 
function readObject(objName) {
	return getNamed(objName).getvalueof()[0];
}

/* istanbul ignore next */ 
function readValues() {
    var i;
    var objName;
    var obj = JSON.parse(JSON.stringify(presetObj));
    var timeObj = getStepsObj({prefix: "time", stepsLen: stepsLen, stepOnly: true});
    for (i = 0; i < timeObj.length; i++) {
        objName = timeObj[i];
        obj.timeSteps[i] = readObject(objName);
	}
	var velObj = getStepsObj({prefix: "vel", stepsLen: stepsLen, stepOnly: true});
    for (i = 0; i < velObj.length; i++) {
        objName = velObj[i];
        obj.velSteps[i] = readObject(objName);
	}
    for (i = 0; i < timeSettingsControls.length; i++) {
        objName = timeSettingsControls[i];
        obj.timeCfg[objName] = readObject(objName);
	}
    for (i = 0; i < velSettingsControls.length; i++) {
        objName = velSettingsControls[i];
        obj.velCfg[objName] = readObject(objName);
	}
    return obj;
}

/* istanbul ignore next */ 
function fileSave(filePath) {
    var obj = readValues();
    var f = new File(filePath, "write");
    f.open();
    if (f.isopen) {
        f.writestring(JSON.stringify(obj));
        f.close();
    } else {
        post("Error\n");
    }
}

/* istanbul ignore next */ 
function setValues(presetObj) {
    var i;
    var value;
    var objName;
    var timeObj = getStepsObj({prefix: "time", stepsLen: stepsLen, stepOnly: true});
    for (i = 0; i < timeObj.length; i++) {
        objName = timeObj[i];
        value = presetObj.timeSteps[i];
        setObject({objName: objName, value: value});
	}
	var velObj = getStepsObj({prefix: "vel", stepsLen: stepsLen, stepOnly: true});
    for (i = 0; i < velObj.length; i++) {
        objName = velObj[i];
        value = presetObj.velSteps[i];
        setObject({objName: objName, value: value});
	}
    for (i = 0; i < timeSettingsControls.length; i++) {
        objName = timeSettingsControls[i];
        value = presetObj.timeCfg[objName];
        setObject({objName: objName, value: value});
	}
    for (i = 0; i < velSettingsControls.length; i++) {
        objName = velSettingsControls[i];
        value = presetObj.velCfg[objName];
        setObject({objName: objName, value: value});
	}
}

/* istanbul ignore next */ 
function fileOpen(filePath) {
    var presetData = "";
    var maxchars = 8000;
    var f = new File(filePath, "read");
    f.open();
    if (f.isopen) {
        while (f.position < f.eof) {
            presetData += f.readstring(maxchars);
        }
        f.close();
    } else {
        post("Error\n");
    }
    var presetObj = JSON.parse(presetData);
    setValues(presetObj);
}

/* istanbul ignore next */ 
function msg_int(x) {
	var timeObj = getStepsObj({prefix: "time", stepsLen: stepsLen});
	var velObj = getStepsObj({prefix: "vel", stepsLen: stepsLen});
	showHideObjects({
		objArray: timeObj,
		hide: true,
	});
	showHideObjects({
		objArray: velObj,
		hide: true,
	});
	showHideObjects({
		objArray: timeSettingsObj,
		hide: true,
	});
	showHideObjects({
		objArray: velSettingsObj,
		hide: true,
	});
	if(x == 0) {
		showHideObjects({
			objArray: timeObj,
			hide: false,
		});
	}
	if(x == 1) {
		showHideObjects({
			objArray: velObj,
			hide: false,
		});
	}
	if(x == 2) {
		showHideObjects({
			objArray: timeSettingsObj,
			hide: false,
		});
	}
	if(x == 3) {
		showHideObjects({
			objArray: velSettingsObj,
			hide: false,
		});
	}
}

exports.getStepsObj = getStepsObj;
exports.showHideObjects = showHideObjects;
exports.getNamed = getNamed;
exports.msg_int = msg_int;