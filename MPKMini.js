/* global EventDispatcher, MidiParser, Tone */

class MPKMini extends EventDispatcher {
  async connect() {
    this.midiAccess = await navigator.requestMIDIAccess();
    this.midiAccess.inputs.forEach((entry) => {
      entry.onmidimessage = this.onmidimessage.bind(this);
    });
    this.dispatchEvent({ type: "connected" });
  }
  onmidimessage(event) {
    const { data, timeStamp } = event;
    const dataView = new DataView(data.buffer);
    const message = { timeStamp };
    let type = this.midimessagetypes[dataView.getUint8(0)];
    //console.log(type);
    switch (type) {
      case "notedown":
      case "noteup":
        const midiKey = dataView.getUint8(1);
        const frequency = Tone.Frequency(midiKey, "midi");
        const velocity = dataView.getUint8(2) / 127;
        Object.assign(message, { velocity, frequency });
        break;
      case "padon":
      case "padoff":
        const padIndex = dataView.getUint8(1) - 0x24;
        if (type === "padon") {
          if (this._lastPadIndex === undefined) {
            this._lastPadIndex = padIndex
          }
        }
        else if (type === "padoff") {
          if (this._lastPadIndex === padIndex) {
            delete this._lastPadIndex
          }
        }
        const pressure = dataView.getUint8(2) / 127;
        Object.assign(message, { pressure });
        type += "-" + (padIndex + 1);
        this.dispatchEvent({
          type: `pad-${padIndex+1}`,
          message
        })
        break;
      case "padchange":
        const _pressure = dataView.getUint8(1) / 127;
        Object.assign(message, { pressure: _pressure});
        type += "-" + (this._lastPadIndex + 1)
        this.dispatchEvent({
          type: `pad-${this._lastPadIndex+1}`,
          message
        })
        break;
      case "joystickX":
        const x = dataView.getUint16(1, true) / 32639;
        Object.assign(message, { x });
        break;
      case "joystickYOrKnob":
        type = dataView.getUint8(1) === 0x01 ? "joystickY" : "knob";
        const value = dataView.getUint8(2) / 127;
        if (type == "joystickY") {
          Object.assign(message, { y: value });
        } else {
          const knobIndex = dataView.getUint8(1) - 0x46;
          Object.assign(message, { value });
          type += "-" + (knobIndex + 1);
        }
        break;
    }
    //console.log({ type, message });
    this.dispatchEvent({
      type,
      message,
    });
  }
  midimessagetypes = {
    0x90: "notedown",
    0x80: "noteup",
    0x99: "padon",
    0xd9: "padchange",
    0x89: "padoff",
    0xe0: "joystickX",
    0xb0: "joystickYOrKnob",
  };
}
