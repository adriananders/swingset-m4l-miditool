# Swing{set}

![screenshot](/guide/scnsht1.png)

Swing{set} is a [Max For Live](https://www.ableton.com/en/live/max-for-live/) [MIDI Transformer](https://www.ableton.com/en/live-manual/12/midi-tools/) for creating dynamic shuffled grooves out of static quantized sequences, leveraging a pair of simple but powerful 16-step offset sequencers.

### Why?
Unlike Ableton's fantastic built-in [Grooves](https://www.ableton.com/en/manual/using-grooves/) feature, Swing{set} is not a black box. What you see is what you get in terms of creating, capturing, and applying rhythmic MIDI offsets. Unlike grooves, Swing{set} can be easily edited once created, with a clear UI indication of what the  settings are doing, allowing precise control over behavior. In addition, unlike Grooves, Swing{set} does not require a prior "groove" source to learn from, allowing users to custom design their own off-kilter beat framework from within the UI alone.

Swing{set} is designed as a non-realtime [MIDI Transformer](https://www.youtube.com/watch?v=E5rHIzm8sck) version of my prior [JayMeter](https://github.com/adriananders/JayMeter-Max4Live) device with some design refinements over the prior effort.

## Features

- WYSIWYG timing and velocity offset sequencing using a pair of 16 step matrices.
- Deep configuration of transformation behavior including:
    - Resolution/Speed of offset sequencer.
    - Quantization of timing and velocity. Includes resolution presets of various popular drum machines.
    - Seeded randomization for consistent randomization behavior.
    - "Quant on 1" - Align all timing adjustments precisely back on the "1", essential for drum loops.
    - Velocity curves for MIDI velocity compression/expansion.
- Capture MIDI - Similar to functionality of groove, but translates the captured MIDI into the timing and velocity matrices for easy editing.
- Preset management - Save and share settings - unique amongst Ableton MIDI Tools, presets are savable, sharable, and easily editable with a text editor as JSON.
- Fully open sourced and documented. Want to get into Ableton MIDI Tool development? Start here!

## Installation
Download [Swing{set}.amxd](Swing{set}.amxd) (or this entire repo). Drop the .amxd file into your Ableton User MIDI Tools folder location:
- MacOS: /Users/[username]/Music/Ableton/User Library/Presets/MIDI Transformers
- Windows: \Users\[username]\Documents\Ableton\User Library/Presets/MIDI Transformers

## Presets can be found [here](/presets) in JSON format.

## [User Guide](/guide/GUIDE.md)

## Demos

### YouTube

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/wANw-zN4JZ-a5KJP/0.jpg)](https://youtu.be/Prog_ZwvrlI)

### Audio Example

- [Listen On Soundcloud](https://on.soundcloud.com/4sdqLhvk6hxhc7Zt8)

## Credits
This repository includes a copy of [seedrandom](https://github.com/davidbau/seedrandom) used under the MIT license.

## Building Dev Enviornment

Developers who wish to review the source should clone the repo, and open the [dev](/src/Swing{set}-dev.amxd) version of the device rather than the frozen [dist](Swing{set}-dev.amxd) device. Dev device should operate fine without running npm install.

## Testing / Linting / Coverage

In order to run tests, linting, and coverage, run `npm install` first (see [npm guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for those new to JS development).

- test: npm test
- lint: npm run lint
- coverage: npm run coverage

## Development Notes

Before starting a MIDI Tools Max for Live MIDI Devices Project, become familiar with both [Max for Live](https://docs.cycling74.com/max8/vignettes/doclive) and [MIDI Tools](https://docs.cycling74.com/max8/vignettes/live_miditools) documentation.

For other developers of Max For Live devices, here are some critical things to note which were learned during the development of this project that are not typically documented in other guides:

- Javascript / JS object is by far the best environment to write Max for Live MIDI Tool transformers and generators due to the ability to properly test, run coverage, and lint the code written. This allows for as close to [test driven development](https://en.wikipedia.org/wiki/Test-driven_development) as possible in the Max development stack. In addition due to its script language nature, code is perfectly portable requiring no separate binary compilation for Windows or MacOS (unlike Java or C externals). The only major downside is that it's not usable for realtime  processing, which of course doesn't really matter for MIDI Tool devices.
- I would personally discourage trying to build MIDI Tools using ONLY built-in Max objects simply due to the data heavy nature of manipulating Ableton MIDI note arrays. In my experience it's far easier to robustly test your methods using Jest unit testing than manually testing with Max alone (which is pretty much the only way to easily test Max patches normally). Although Max is fantastic for quickly rapid prototyping DSP solutions, it's pretty poor at reliably manipulating data structures compared to Javascript.
- Max (as of 8.6.x) js object only supports [ES5](https://cycling74.com/forums/what-ecmascript-version-is-used-in-max-for-javascript) (circa 2009) language features. This means the past ~10 years of advancement resulting from ES6 are not at all supported with this particular object. Please hold on comments regarding node.script, I will get to that below. This old language version very much limits what can be done with making compact re-usable javascript code in Max. Examples of unsupported ES6 features include:
    - [const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
    - [class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
    - [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
    - [Destructuring Assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
- Max For Live MIDI Tools, particularly transformers requires [synchronous operations](https://cycling74.com/forums/using-nodescript-in-midi-generator-for-ableton-12#reply-661cf00bcb025000137cbe37) to function. Since node.script object runs node in a separate process, it is always asynchronous with its operation. Thus developers who wish to use javascript in a MIDI Tool are forced to use the JS object with its ES5 limitations. Hopefully this changes in the future.
- Both input and output of MIDI Tools are expected to be a [Dictionary](https://docs.cycling74.com/max8/vignettes/dictionaries) Max Object. Note this is NOT the same as a javascript object, even though they are structurally very similar. Thus in order to work with the note arrays passed by Ableton or return to the MIDI Tool outlet in Javascript, one must perform a conversion operation. I provide an example [here](https://github.com/adriananders/swingset-m4l-miditool/blob/main/src/swingSet.js#L500).
- Highly recommended in your JS to robustly [separate concerns](https://en.wikipedia.org/wiki/Separation_of_concerns#:~:text=Separation%20of%20concerns%20is%20a%20form%20of%20abstraction.,reuse%20of%20more%20optimized%20code.) of your methods, specifically the declaration or invocation of Max objects or methods. This will save signficant time and frustration with unit testing in Jest.
- Because of ES5 limitations regarding referencing exports, it's nearly impossible to properly mock Max objects and methods within Jest without breaking functionality of the device. Rather than continue to bang ones head against the wall trying to fit an ES6 testing paradigm into ES5 limitations, I recommend to [Istanbul ignore](https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md) certain methods which inherently must have direct interaction with Max. It makes for an easy read to identify which pieces are fundamentally tied to the Max environment versus those parts that could be reused outside of the project.
- External libraries must be ES5 compatible (or babelfied into ES5) and you must import them using require rather than import statements. Likewise for jest testing, exports (which is es5 compatible) must be used (rather than export module style). Highly recommended that you duplicate libraries into their own file in the same folder rather than rely on node_modules when using it in a Max Project.
- Don't rely on jest and unit testing alone to ensure that your JS methods work in Max. It's unfortunate, but because the ES version of js objects are so old, and the untestable nature of Max objects/methods are, the only way you can be 100% certain that your script will run properly is to perform manual testing as well. I would recommend a testing effort spent of 75% Jest, 25% Manual at the end once you know your discrete JS only functions work as expected otherwise. Read the console in Max to debug!
- MIDI Tool Devices OOTB don't support presets currently (as of June 2024). If your device is sufficiently complex as to require some presetting or saving of settings, it is recommended you follow a similar handling of saving and opening JSON files of your device's settings.