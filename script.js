/* global MPKMini, pinkTromboneElements, envelopes, myConstrictions, frontConstriction, backConstriction, pinkTromboneParameters, setPinkTrombonesValue, setPinkTromboneValue, updateMenuInputs, updateMenuInput, updateSelectedKeyframe, selectedButton, togglePlayback, stop, copySelectedKeyframe, pasteKeyframe, deleteSelectedKeyframe, addKeyframe, toggleLoop, defaultEnvelopeSpeed, toggleSelectedKeyframeSustain, keyframes, triggerAttack, triggerRelease, multiButtons, updateButton, deselectButton, clearMultiButtons, getAdjacentKeyframes, selectButton, silence, includeButtonsUpToThisButton, updateMultiButtonPositions, totalTime, updateMultiButtons, sortKeyframes, enableEnvelopePitchBending, setMultiButtons */

const interpolate = (from, to, interpolation) => {
  return from + interpolation * (to - from);
};

const getAvailablePinkTrombone = () => {
  let earliestPinkTrombone;
  let availablePinkTrombone = pinkTromboneElements.find(
    (pinkTromboneElement) => {
      if (!earliestPinkTrombone) {
        earliestPinkTrombone = pinkTromboneElement;
      } else {
        earliestPinkTrombone =
          earliestPinkTrombone._timeTaken < pinkTromboneElement._timeTaken
            ? earliestPinkTrombone
            : pinkTromboneElement;
      }

      if (!pinkTromboneElement._isNotAvailable) {
        pinkTromboneElement._isNotAvailable = true;
        return pinkTromboneElement;
      }
    }
  );

  availablePinkTrombone = availablePinkTrombone || earliestPinkTrombone;
  availablePinkTrombone._timeTaken = Date.now();
  return availablePinkTrombone;
};
const freePinkTrombone = (pinkTromboneElement) => {
  delete pinkTromboneElement._isNotAvailable;
};
const getPinkTromboneByFrequency = (frequency) => {
  return pinkTromboneElements.find((pinkTromboneElement) => {
    return pinkTromboneElement?._frequency?.toNote() == frequency.toNote();
  });
};

const voicelessSustain = 0.9;
let voiceness = 1;
function setVoiceness(_voiceness) {
  voiceness = _voiceness;
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    if (!pinkTromboneElement.didStart) {
      return;
    }
    const { envelope } = pinkTromboneElement;
    envelope.sustain = interpolate(
      voicelessSustain,
      envelope.defaultSustain,
      voiceness
    );
    const tenseness = 1 - Math.cos(voiceness * Math.PI * 0.5);
    const loudness = Math.pow(tenseness, 0.25);
    setPinkTromboneValue("tenseness", null, tenseness, pinkTromboneElement);
    setPinkTromboneValue("loudness", null, loudness, pinkTromboneElement);

    updateMenuInput("voiceness", null, pinkTromboneElement);

    if (selectedButton) {
      selectedButton.keyframe.tenseness = tenseness;
      selectedButton.keyframe.loudness = loudness;

      setMultiButtons("tenseness", tenseness);
      setMultiButtons("loudness", loudness);
    }
  });
}
pinkTromboneElements.forEach((pinkTromboneElement) => {
  pinkTromboneElement.addEventListener("start", () => setVoiceness(1));
});

const midiKeyboard = new MPKMini();
midiKeyboard.connect();

const downKeys = [];
const getTargetKeyframes = () => {
  return [selectedButton, ...multiButtons]
    .sort((a, b) => a.keyframe.time - b.keyframe.time)
    .map((button) => button.keyframe);
};
midiKeyboard.addEventListener("notedown", (event) => {
  const pinkTromboneElement = getAvailablePinkTrombone();
  if (!pinkTromboneElement) {
    return;
  }

  let { frequency, velocity } = event.message;
  velocity = 1.5 * velocity;
  pinkTromboneElement._frequency = frequency;
  const _frequency = frequency.toFrequency();

  setPinkTromboneValue("frequency", null, _frequency, pinkTromboneElement);
  updateMenuInput("frequency", null, pinkTromboneElement);

  if (selectedButton) {
    selectedButton.keyframe.frequency = _frequency;
    updateButton(selectedButton);
    updateMultiButtons();
  }

  if (!selectedButton) {
    if (keyframes.length === 0) {
      pinkTromboneElement.envelope.triggerAttack(
        interpolate(voicelessSustain, velocity, voiceness)
      );
    } else {
      triggerAttack(
        velocity,
        frequency,
        defaultEnvelopeSpeed,
        pinkTromboneElement
      );
    }
  }

  if (selectedButton) {
    if (multiButtons.length > 0) {
      const targetKeyframes = getTargetKeyframes();
      triggerAttack(
        velocity,
        frequency,
        defaultEnvelopeSpeed,
        pinkTromboneElement,
        targetKeyframes
      );
    } else {
      pinkTromboneElement.envelope.triggerAttack(
        interpolate(voicelessSustain, velocity, voiceness)
      );
    }
  }

  downKeys.push(frequency.toNote());
});
midiKeyboard.addEventListener("noteup", (event) => {
  const { frequency } = event.message;
  downKeys.splice(downKeys.indexOf(frequency.toNote()), 1);
  const pinkTromboneElement = getPinkTromboneByFrequency(frequency);
  if (!pinkTromboneElement) {
    return;
  }

  if (!selectedButton && keyframes.length === 0) {
    pinkTromboneElement.envelope.triggerRelease();
  }
  if (!selectedButton) {
    if (keyframes.length === 0) {
      pinkTromboneElement.envelope.triggerRelease();
    } else {
      triggerRelease(0, frequency, defaultEnvelopeSpeed, pinkTromboneElement);
    }
  }

  if (selectedButton) {
    if (multiButtons.length > 0) {
      const targetKeyframes = getTargetKeyframes();
      triggerRelease(
        0,
        frequency,
        defaultEnvelopeSpeed,
        pinkTromboneElement,
        targetKeyframes
      );
    } else {
      pinkTromboneElement.envelope.triggerRelease();
    }
  }

  freePinkTrombone(pinkTromboneElement);
});

let pitchBendSemitones = 3;
midiKeyboard.addEventListener("joystickX", (event) => {
  const { x } = event.message;
  let pitchBend = (x - 0.5) * 2;
  pitchBend = 2 ** (pitchBend * (pitchBendSemitones / 12));
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    if (!pinkTromboneElement._frequency) {
      return;
    }
    const bentFrequency =
      pinkTromboneElement._frequency.toFrequency() * pitchBend;
    setPinkTromboneValue("frequency", null, bentFrequency, pinkTromboneElement);
    updateMenuInput("frequency", null, pinkTromboneElement);
  });
});

midiKeyboard.addEventListener("joystickY", (event) => {
  const value = event.message.y;
  setPinkTrombonesValue("vibrato", "wobble", value);
  updateMenuInput("vibrato", "wobble");

  setPinkTrombonesValue("vibrato", "gain", value * 0.1);
  updateMenuInput("vibrato", "gain");
});

midiKeyboard.addEventListener("pad-0", (event) => {
  const { pressure } = event.message;
  setPinkTrombonesValue("intensity", null, pressure);
  updateMenuInput("intensity", null);
  updateSelectedKeyframe("intensity");
});

midiKeyboard.addEventListener("knob-1", (event) => {
  const { value } = event.message;
  const newIndex = interpolate(
    pinkTromboneParameters.tongue.index.min,
    pinkTromboneParameters.tongue.index.max,
    value
  );
  setPinkTromboneValue("tongue", "index", newIndex);
  updateMenuInput("tongue", "index");
  updateSelectedKeyframe("tongue.index");
});
midiKeyboard.addEventListener("knob-2", (event) => {
  let { value } = event.message;
  value = 1 - value;
  const newDiameter = interpolate(
    pinkTromboneParameters.tongue.diameter.min,
    pinkTromboneParameters.tongue.diameter.max,
    value
  );
  setPinkTromboneValue("tongue", "diameter", newDiameter);
  updateMenuInput("tongue", "diameter");
  updateSelectedKeyframe("tongue.diameter");
});

midiKeyboard.addEventListener("knob-3", (event) => {
  const { value } = event.message;
  const newIndex = interpolate(
    pinkTromboneParameters.frontConstriction.index.min,
    pinkTromboneParameters.frontConstriction.index.max,
    value
  );
  setPinkTromboneValue("frontConstriction", "index", newIndex);
  updateMenuInput("frontConstriction", "index");
  updateSelectedKeyframe("frontConstriction.index");
});
midiKeyboard.addEventListener("knob-4", (event) => {
  let { value } = event.message;
  value = 1 - value;
  const newDiameter = interpolate(
    pinkTromboneParameters.frontConstriction.diameter.min,
    pinkTromboneParameters.frontConstriction.diameter.max,
    value
  );
  setPinkTromboneValue("frontConstriction", "diameter", newDiameter);
  updateMenuInput("frontConstriction", "diameter");
  updateSelectedKeyframe("frontConstriction.diameter");
});

// INTENSITY CONTROLLER
midiKeyboard.addEventListener("knob-5", (event) => {
  const { value } = event.message;
  setPinkTromboneValue("intensity", null, value);
  updateMenuInput("intensity");
  updateSelectedKeyframe("intensity");
});
// FREQUENCY CONTROLLER
midiKeyboard.addEventListener("knob-6", (event) => {
  const { value } = event.message;
  const frequency = interpolate(
    pinkTromboneParameters.frequency.min,
    pinkTromboneParameters.frequency.max,
    value
  );
  setPinkTromboneValue("frequency", null, frequency);
  updateMenuInput("frequency");
  updateSelectedKeyframe("frequency");

  if (selectedButton) {
    setTimeout(() => {
      updateMultiButtons();
    }, 10);
  }
});
// VOICENESS CONTROLLER
midiKeyboard.addEventListener("knob-7", (event) => {
  const { value } = event.message;
  setVoiceness(value);
});

const timelineSlider = document.getElementById("timelineSlider");
midiKeyboard.addEventListener("knob-8", (event) => {
  const { value } = event.message;
  const time = value * totalTime;
  timelineSlider.value = time;
  timelineSlider.dispatchEvent(new Event("input"));

  if (selectedButton) {
    selectedButton.keyframe.time = time;
    updateButton(selectedButton);
    updateMultiButtons();
    sortKeyframes();
  }
});

midiKeyboard.addEventListener("padon-5", (event) => {
  togglePlayback();
});
midiKeyboard.addEventListener("padon-6", (event) => {
  stop();
});
midiKeyboard.addEventListener("padon-7", (event) => {
  addKeyframe();
});
midiKeyboard.addEventListener("padon-8", (event) => {
  deleteSelectedKeyframe();
});

midiKeyboard.addEventListener("padon-1", (event) => {
  copySelectedKeyframe();
});
midiKeyboard.addEventListener("padon-2", (event) => {
  pasteKeyframe();
});
midiKeyboard.addEventListener("padon-3", (event) => {
  if (selectedButton) {
    deselectButton();
    clearMultiButtons();
    silence();
  } else {
    const { closest } = getAdjacentKeyframes();
    if (closest) {
      selectButton(closest.button);
    }
  }
});
midiKeyboard.addEventListener("padon-4", (event) => {
  toggleSelectedKeyframeSustain();
});
