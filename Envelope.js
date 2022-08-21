class Envelope {
  constructor(audioParam, audioContext, options = {}) {
    this.param = audioParam;
    this.context = audioContext;

    this.attack = 0.1;
    this.decay = 0.1;
    this.sustain = this.defaultSustain;
    this.release = 0.6;
    
    for (const key in options) {
      if (key in this) {
        this[key] = options[key]
      }
    }
  }
  
  defaultSustain = 0.5;
  
  get now() {
    return this.context?.currentTime
  }
  
  cancel() {
    this.param.cancelScheduledValues(this.now);
  }

  triggerAttack(velocity = 1) {
    this.cancel();
    this.param.linearRampToValueAtTime(velocity, this.now + this.attack)
    this.param.linearRampToValueAtTime(this.sustain, this.now + this.attack + this.decay)    
  }
  triggerRelease() {
    this.cancel();
    this.param.linearRampToValueAtTime(0, this.now + this.release)
  }
  triggerAttackRelease(duration, time, velocity) {}
}
