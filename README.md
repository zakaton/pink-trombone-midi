# Pink Trombone Editor

_A simple timeline editor for Neil Thapen's [Pink Trombone](https://dood.al/pinktrombone/)_

__(Note: when I say "ctrl", I mean the ctrl key for Windows, and the command key for Mac)__

## Table of Contents

🎛 Controlling the Pink Trombone  
▶️ Timeline and Playback  
👄 Strings  
📂 Saving, Loading, and Exporting
🎹 MIDI Keyboard

### 🎛 Controlling the Pink Trombone

Click anywhere on the screen to start the Audio Context (or optionally the "Start" button on the Pink Trombone UI)

Click and drag the red circle horizontally to control frequency, and vertically to control voiceness (top is voiced, bottom is voiceless, like a whisper)

Click and drag the pink circle to control the tongue

In addition to clicking in the Pink Trombone UI, you can also control the various attributes in the top bar (right of the "export" button)

In the top right are some "phoneme presets" (starting with **[æ (pAt)]** and ending with **[l (Like)]**), which will transform the Pink Trombone to a particular phoneme (the part in parenthesis is how it sounds, e.g. _æ as in "pAt"_ and _l as in "Like"_)

### ▶️ Timeline and Playback

You can place keyframes on the timeline, with the y-axis representing pitch. When a keyframe is selected, you can manipulate the Pink Trombone to update the keyframe. You can also click+drag to move it around the timeline. You can select multiple keyframes by holding shift or ctrl when clicking other keyframes.

You can also use the arrow keys to move the selected keys around the timeline, and even copy+paste keyframes. The Up/Down arrow keys move the selected keyframes a single semitone, and holding the shift key moves them a whole octave. the Left/Right arrow keys move them 0.01 seconds, and holding the shift key moves the 0.1 seconds.

You can select keyframes from the keyboard by holding ctrl+left/right, selectig the closest keyframe to the current time on the timeline, and moving to the adjacent keys by pressing the left/right keys again (while holding the ctrl key). Holding the shift+ctrl keys selects multiple keys as you move left/right.

You can use the Space Bar to toggle Playback.

### 👄 Strings

Strings are unique timelines, each with their own keyframes. You can create, delete, duplicate, and rename strings.

### 📂 Saving, Loading, and Exporting

Saving (ctrl+s) saves all the timelines to local storage. You can also Export (ctrl+e) the timelines to a .json file you can share with others to Load (ctrl+l) remotely.

### 🎹 MIDI Keyboard

If you have a MIDI Keyboard connected (preferably the [MPK Mini mk3 MIDI Controller](https://www.akaipro.com/mpk-mini-mk3)), you can control the Pink Trombone and Playback controls:

Piano Keys will set the frequency of the Pink Trombone. If the timeline is empty it will trigger a basic envelope based on the pitch and velocity of the note played. If the timeline has at least 1 keyframe that isn't selected, it will play the timeline, shifting the pitches of the keyframes relative to the pitch played (the first keyframe is pitch shifted to the pitch played, and other keyframes are pitch shifted based on its relative pitch to the first keyframe). If a single keyframe is selected, it will set its pitch to the note played, as well as triggering a basic envelope for that single keyframe's Pink Trombone articulation. If multiple keyframes are selected, it will shift the pitches relative to the note played, as well as playing the timeline for the selected notes.

If there is a Sustain keyframe (the button will be rounded), then holding down a key will play the timeline up to that Sustain keyframe and hold it until the key is released, playing the rest of the timeline.

The joystick controls the pitch bending (horizontal movement) and wobble (vertical movement)

The pads control the timeline as follows:

1. Copy Selected Keyframe
2. Paste Selected Keyframe
3. Select/Deselect Nearest Keyframe on Timeline
4. Toggle keyframe Sustain (only 1 sustain key per timeline)

5. Toggle Playback
6. Stop Playback
7. Add Keyframe
8. Delete Keyframe

The Knobs control the following:

1. Tongue Index
2. Tongue Diameter
3. Constriction Index
4. Constriction Diameter

5. Volume
6. Frequency
7. Voiceness
8. Timeline
