function draw() {
var HighSynth = new Class({
    Extends: AudioletGroup,
    initialize: function(audiolet) {
        AudioletGroup.prototype.initialize.apply(this, [audiolet, 0, 1]);
        
        // Triangle base oscillator
        this.triangle = new Triangle(audiolet);
        
        // Note on trigger
        this.trigger = new TriggerControl(audiolet);

        // Gain envelope
        this.gainEnv = new PercussiveEnvelope(audiolet, 0, 0.05, 0.05);
        this.gainEnvMulAdd = new MulAdd(audiolet, 0.25);
        this.gain = new Gain(audiolet);

        // Connect oscillator
        this.triangle.connect(this.gain);
        
        // Connect trigger and envelope
        this.trigger.connect(this.gainEnv);
        this.gainEnv.connect(this.gainEnvMulAdd);
        this.gainEnvMulAdd.connect(this.gain, 0, 1);
        this.gain.connect(this.outputs[0]);
    }
});

    var map = function(value, istart, istop, ostart, ostop) {
        return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
    };

    var midiToFreq = function(midi) {
        if (midi === 60 || midi === 61) return 262; // C
        else if (midi === 62 || midi === 63) return 294; // D
        else if (midi === 64) return 330; // E
        else if (midi === 65 || midi === 66) return 349; // F
        else if (midi === 67 || midi === 68) return 392; // G
        else if (midi === 69 || midi === 70) return 440; // A
        else if (midi === 71) return 494; // B
    };

    var audiolet = new Audiolet();
    var synthRed = new HighSynth(audiolet);
    var synthGreen = new HighSynth(audiolet);
    var synthBlue = new HighSynth(audiolet);
    frequencyRed = new PProxy(new PSequence([40,40],
                                            2));
    frequencyGreen = new PProxy(new PSequence([40,40],
                                            2));
    frequencyBlue = new PProxy(new PSequence([40,40],
                                            2));

    var box = document.getElementById('box');

    audiolet.scheduler.play([frequencyRed, frequencyGreen, frequencyBlue], 0.5,
        function(fR, fG, fB) {
            synthRed.trigger.trigger.setValue(1);
            synthRed.triangle.frequency.setValue(midiToFreq(Math.round(map(fR, 0, 255, 60, 71))));
            synthGreen.trigger.trigger.setValue(1);
            synthGreen.triangle.frequency.setValue(midiToFreq(Math.round(map(fG, 0, 255, 60, 71))));
            synthBlue.trigger.trigger.setValue(1);
            synthBlue.triangle.frequency.setValue(midiToFreq(Math.round(map(fB, 0, 255, 60, 71))));

            box.style.backgroundColor = "rgb(" + fR.toString() +"," + fG.toString() + "," + fB.toString() + ")";

        }
    );  

    synthRed.connect(audiolet.output);
    synthGreen.connect(audiolet.output);
    synthBlue.connect(audiolet.output);

    var ctx = document.getElementById('canvas').getContext('2d');  
    var img = new Image();  
    img.src = 'hear-the-img/img/pollock.jpg';
    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;
    var pixels = 0;

    ctx.drawImage(img, 0, 0); 
    console.log(img.width);
    var pixels = ctx.getImageData(0, 0, img.width, img.height);
    var pixelsList = [];
    console.log(pixels.height, pixels.width);
    
    for (j=0; j<pixels.height; j++) {
        for (i=0; i<pixels.width; i++) {
            var index = (i*4) * pixels.width + (j*4);
            var r = pixels.data[index];
            var g = pixels.data[index+1];
            var b = pixels.data[index+2];
            var a = pixels.data[index+3];
            pixelsList.push({red: r, green: g, blue: b, alpha: a});
        }
    }

    for (var i=0; i<pixelsList.length; i++) {
        frequencyRed.pattern.list[i] = pixelsList[i].red;
        frequencyGreen.pattern.list[i] = pixelsList[i].green;
        frequencyBlue.pattern.list[i] = pixelsList[i].blue;
    }

    //console.log(frequencyPattern.pattern.list);
}