var HighSynth = new Class({
    Extends: AudioletGroup,
    initialize: function(audiolet) {
        AudioletGroup.prototype.initialize.apply(this, [audiolet, 0, 1]);
        
        // Triangle base oscillator
        this.triangle = new Triangle(audiolet);
        
        // Note on trigger
        this.trigger = new TriggerControl(audiolet);
        
        // Gain envelope
        this.gainEnv = new PercussiveEnvelope(audiolet, 0, 0.02, 0.05);
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
synthRed.connect(audiolet.output);
synthGreen.connect(audiolet.output);
synthBlue.connect(audiolet.output);

var evt = [];

var painters = {'monalisa': {title: 'Mona Lisa', author: 'Leonardo da Vinci', year: '1503', url: 'http://en.wikipedia.org/wiki/Leonardo_da_Vinci'},
                'mondrian': {title: 'Composition II in Red, Blue, and Yellow', author: 'Piet Mondrian', year: '1930', url: 'http://en.wikipedia.org/wiki/Piet_Mondrian'},
                'picasso': {title: 'Three Musicians', author: 'Pablo Picasso', year: '1921', url: 'http://en.wikipedia.org/wiki/Pablo_Picasso'},
                'roy': {title: 'Whaam!', author: 'Roy Lichtenstein', year: '1963', url: 'http://en.wikipedia.org/wiki/Roy_Lichtenstein'},
                'brice': {title: 'Vine', author: 'Brice Marden', year: '1992-1993', url: 'http://en.wikipedia.org/wiki/Roy_Lichtenstein'},
                'pollock': {title: 'No. 1', author: 'Jackson Pollock', year: '1950', url: 'http://en.wikipedia.org/wiki/Jackson_Pollock'},
                'pollock2': {title: 'No. 5', author: 'Jackson Pollock', year: '1948', url: 'http://en.wikipedia.org/wiki/Jackson_Pollock'},
                'stella2': {title: 'Hampton Roads', author: 'Frank Stella', year: '1962', url: 'http://en.wikipedia.org/wiki/Frank_Stella'},
                'stella3': {title: 'New Madrid', author: 'Frank Stella', year: '1962', url: 'http://en.wikipedia.org/wiki/Frank_Stella'},
                'stella4': {title: 'Delaware Crossing', author: 'Frank Stella', year: '1962', url: 'http://en.wikipedia.org/wiki/Frank_Stella'},
                'stella5': {title: 'Sabine Pass', author: 'Frank Stella', year: '1962', url: 'http://en.wikipedia.org/wiki/Frank_Stella'},
                'stella6': {title: 'Palmito Ranch', author: 'Frank Stella', year: '1962', url: 'http://en.wikipedia.org/wiki/Frank_Stella'},
                'stella7': {title: 'Island No. 10', author: 'Frank Stella', year: '1962', url: 'http://en.wikipedia.org/wiki/Frank_Stella'},
                'hofmann': {title: 'The Gate', author: 'Hans Hofmann', year: '1959-1960', url: 'http://en.wikipedia.org/wiki/Hans_Hofmann'},
                'monet': {title: 'Haystacks', author: 'Claude Monet', year: '1890-1891', url: 'http://en.wikipedia.org/wiki/Claude_Monet'},
                'theo': {title: 'Neo-Plasticism: Composition VII (the three graces)', author: 'Theo van Doesburg', year: '1924', url: 'http://en.wikipedia.org/wiki/Theo_van_Doesburg'},
               };

var play = function (id) {
    var box = document.getElementById('box');
    var p = document.getElementById('about');
    p.innerHTML = painters[id].title + '<br />' + painters[id].author + '<br />' + painters[id].year;
    var frequencyRed = new PProxy(new PSequence([0], Infinity));
    var frequencyGreen = new PProxy(new PSequence([0], Infinity));
    var frequencyBlue = new PProxy(new PSequence([0], Infinity));

    if (evt.length > 0) {
        audiolet.scheduler.stop(evt[0]);
        evt.pop();
    }

    evt.push( audiolet.scheduler.play([frequencyRed, frequencyGreen, frequencyBlue], 0.25,
                                      function(fR, fG, fB) {
                                          synthRed.trigger.trigger.setValue(1);
                                          synthRed.triangle.frequency.setValue(midiToFreq(Math.round(map(fR, 0, 255, 60, 71))));
                                          synthGreen.trigger.trigger.setValue(1);
                                          synthGreen.triangle.frequency.setValue(midiToFreq(Math.round(map(fG, 0, 255, 60, 71))));
                                          synthBlue.trigger.trigger.setValue(1);
                                          synthBlue.triangle.frequency.setValue(midiToFreq(Math.round(map(fB, 0, 255, 60, 71))));

                                          box.style.backgroundColor = "rgb(" + fR.toString() +"," + fG.toString() + "," + fB.toString() + ")";
                                      }));  
    
    var cv = document.getElementById('canvas');
    var ctx = cv.getContext('2d');  
    var img = document.getElementById(id);

    ctx.canvas.width = img.width;
    ctx.canvas.height = img.height;

    ctx.drawImage(img, 0, 0); 

    var pixels = ctx.getImageData(0, 0, img.width, img.height);
    var pixelsList = [];
    
    for (i=0; i<pixels.height; i++) {
        for (j=0; j<pixels.width; j++) {
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
}