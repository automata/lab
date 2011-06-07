// happy hacking!

var audiolet = new Audiolet();

var saw = new Saw(audiolet);
var gain = new Gain(audiolet);
var low = new LowPassFilter(audiolet, 10);
var env = new ADSREnvelope(audiolet,
                           1, // Gate
                           0.5, // Attack
                           0.2, // Decay
                           0.9, // Sustain
                           1); // Release
saw.connect(gain);
gain.connect(audiolet.output);
env.connect(gain);

notes = new PProxy(new PSequence([44, 66, 88, 66], Infinity));
gates = new PProxy(new PSequence([1, 0, 1, 0], Infinity));
durations = new PProxy(new PSequence([1, 0.5], Infinity));

audiolet.scheduler.play([notes, gates], durations,
                        function (freq, gate) {
                            saw.frequency.setValue(freq);
                            env.gate.setValue(gate);
                        });

var run = function (str) {
    eval(str);
};