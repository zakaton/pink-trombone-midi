/* global MPKMiniPlay, pinkTromboneElements, envelopes, myConstrictions */

const audioContext = Tone.context.rawContext._nativeAudioContext;
audioContext.addEventListener("statechange", () => {
  console.log(audioContext.state);
  if (audioContext.state !== "running") {
    document.addEventListener("click", () => audioContext.resume(), {
      once: true,
    });
  }
});
audioContext.dispatchEvent(new Event("statechange"));

let pinkTromboneElements = Array.from(
  document.querySelectorAll("pink-trombone")
);

let envelopes = [];
let myConstrictions = [];
pinkTromboneElements.forEach((pinkTromboneElement, index) => {
  pinkTromboneElement._index = index;
  pinkTromboneElement.addEventListener("load", (event) => {
    pinkTromboneElement.setAudioContext(audioContext).then((pinkTrombone) => {
      if (index === 0) {
        pinkTromboneElement.enableUI();
        pinkTromboneElement.startUI();
      }

      const envelope = new Envelope(
        pinkTromboneElement.pinkTrombone._pinkTromboneNode.intensity,
        pinkTromboneElement.audioContext
      );
      pinkTromboneElement._envelope = envelope;
      envelopes[index] = envelope;

      pinkTromboneElement.connect(pinkTromboneElement.audioContext.destination);
      pinkTromboneElement.start();
      pinkTromboneElement.pinkTrombone._pinkTromboneNode.intensity.value = 0;
      pinkTromboneElement.pinkTrombone._pinkTromboneNode.vibrato.wobble.value = 0;
      const myConstriction = pinkTromboneElement.newConstriction(43, 1.8);
      pinkTromboneElement.myConstriction = myConstriction;
      myConstrictions[index] = myConstriction;
      pinkTromboneElement.dispatchEvent(new Event("start"));
    });
  });
});

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
  delete pinkTromboneElement._frequency;
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
  envelopes.forEach((envelope, index) => {
    envelope.sustain = interpolate(
      voicelessSustain,
      envelope.defaultSustain,
      voiceness
    );

    const tenseness = 1 - Math.cos(voiceness * Math.PI * 0.5);
    const loudness = Math.pow(tenseness, 0.25);
    const pinkTromboneElement = pinkTromboneElements[index];
    pinkTromboneElement.tenseness.linearRampToValueAtTime(
      tenseness,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
    pinkTromboneElement.loudness.linearRampToValueAtTime(
      loudness,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
}
pinkTromboneElements.forEach((pinkTromboneElement) => {
  pinkTromboneElement.addEventListener("start", () => setVoiceness(1));
});

const midiKeyboard = new MPKMiniPlay();
midiKeyboard.connect();

const downKeys = [];
midiKeyboard.addEventListener("notedown", (event) => {
  const pinkTromboneElement = getAvailablePinkTrombone();
  if (!pinkTromboneElement) {
    return;
  }

  const { frequency, velocity } = event.message;
  pinkTromboneElement._frequency = frequency;
  const _frequency = frequency.toFrequency();
  pinkTromboneElement.frequency.linearRampToValueAtTime(
    _frequency,
    pinkTromboneElement.audioContext.currentTime + 0.01
  );
  pinkTromboneElement._envelope.triggerAttack(
    interpolate(voicelessSustain, velocity, voiceness)
  );

  downKeys.push(frequency.toNote());
});
midiKeyboard.addEventListener("noteup", (event) => {
  const { frequency } = event.message;
  downKeys.splice(downKeys.indexOf(frequency.toNote()), 1);
  const pinkTromboneElement = getPinkTromboneByFrequency(frequency);
  if (!pinkTromboneElement) {
    return;
  }

  pinkTromboneElement._envelope.triggerRelease();
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
    pinkTromboneElement.frequency.linearRampToValueAtTime(
      pinkTromboneElement._frequency?.toFrequency() * pitchBend,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});

// VOICENESS CONTROLLER
midiKeyboard.addEventListener("knob-0", (event) => {
  const { value } = event.message;
  setVoiceness(value);
});
midiKeyboard.addEventListener("joystickY", (event) => {
  const value = event.message.y;
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    pinkTromboneElement.vibrato.wobble.linearRampToValueAtTime(
      value,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
    pinkTromboneElement.vibrato.gain.linearRampToValueAtTime(
      value * 0.1,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});
midiKeyboard.addEventListener("pad-1", (event) => {
  const { pressure } = event.message;
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    pinkTromboneElement.intensity.linearRampToValueAtTime(
      pressure,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});

midiKeyboard.addEventListener("knob-1", (event) => {
  const { value } = event.message;
  const newIndex = interpolate(11, 30, value);
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    pinkTromboneElement.tongue.index.linearRampToValueAtTime(
      newIndex,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});
midiKeyboard.addEventListener("knob-2", (event) => {
  let { value } = event.message;
  value = 1 - value;
  const newDiameter = interpolate(2, 3.6, value);
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    pinkTromboneElement.tongue.diameter.linearRampToValueAtTime(
      newDiameter,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});

midiKeyboard.addEventListener("knob-3", (event) => {
  const { value } = event.message;
  const newIndex = interpolate(10.8, 43.7, value);
  myConstrictions.forEach((myConstriction, index) => {
    const pinkTromboneElement = pinkTromboneElements[index];
    myConstriction.index.linearRampToValueAtTime(
      newIndex,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});
midiKeyboard.addEventListener("knob-4", (event) => {
  let { value } = event.message;
  value = 1 - value;
  const newDiameter = interpolate(-1.2, 5, value);
  myConstrictions.forEach((myConstriction, index) => {
    const pinkTromboneElement = pinkTromboneElements[index];
    myConstriction.diameter.linearRampToValueAtTime(
      newDiameter,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});

// INTENSITY CONTROLLER
midiKeyboard.addEventListener("knob-0", (event) => {
  const { value } = event.message;
  pinkTromboneElements.forEach((pinkTromboneElement) => {
    pinkTromboneElement.intensity.linearRampToValueAtTime(
      value,
      pinkTromboneElement.audioContext.currentTime + 0.01
    );
  });
});
