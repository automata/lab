window.onload = function () {
    Synth = new Class({
        Extends: AudioletGroup,
        initialize: function(audiolet) {
            AudioletGroup.prototype.initialize.apply(this, [audiolet, 0, 1]);
            // Basic wave
            this.saw = new Saw(audiolet, 100);
            
            // Frequency LFO
            this.frequencyLFO = new Sine(audiolet, 2);
            this.frequencyMA = new MulAdd(audiolet, 10, 100);

            // Filter
            this.filter = new LowPassFilter(audiolet, 1000);
            
            // Filter LFO
            this.filterLFO = new Sine(audiolet, 8);
            this.filterMA = new MulAdd(audiolet, 900, 1000);

            // Gain envelope
            this.gain = new Gain(audiolet);
            this.env = new ADSREnvelope(audiolet,
                                        1, // Gate
                                        1.5, // Attack
                                        0.2, // Decay
                                        0.9, // Sustain
                                        2); // Release

            // Main signal path
            this.saw.connect(this.filter);
            this.filter.connect(this.gain);
            this.gain.connect(this.outputs[0]);

            // Frequency LFO
            this.frequencyLFO.connect(this.frequencyMA);
            this.frequencyMA.connect(this.saw);

            // Filter LFO
            this.filterLFO.connect(this.filterMA);
            this.filterMA.connect(this.filter, 0, 1);

            // Envelope
            this.env.connect(this.gain, 0, 1);
        }
    });

    var audiolet = new Audiolet();
    var synth = new Synth(audiolet);
    var freqs = [];
    for (var i = 8; i--;) {
        freqs.push(48);
    }
    frequencyPattern = new PProxy(new PSequence(freqs,
                                                Infinity));

    filterLFOPattern = new PProxy(new PChoose([2, 4, 6, 8], Infinity));
    gatePattern = new PProxy(new PSequence([1, 0], Infinity));

    var patterns = [frequencyPattern, filterLFOPattern, gatePattern];
    audiolet.scheduler.play(patterns, 2,
        function(frequency, filterLFOFrequency, gate) {
            this.frequencyMA.add.setValue(frequency);
            //this.filterLFO.frequency.setValue(filterLFOFrequency);
            //this.env.gate.setValue(gate);
        }.bind(synth)
    );  

    synth.connect(audiolet.output);


    var W = 600,
    H = 400,
    r = Raphael("main", W, H),
    values = [],
    len = 8;
    for (var i = len; i--;) {
        values.push(10);
    }
    
    function translate(x, y) {
        return [
            50 + (W - 60) / (values.length - 1) * x,
            H - 10 - (H - 20) / 100 * y
        ];
    }
    
    function getAnchors(p1x, p1y, p2x, p2y, p3x, p3y) {
        var l1 = (p2x - p1x) / 2,
        l2 = (p3x - p2x) / 2,
        a = Math.atan((p2x - p1x) / Math.abs(p2y - p1y)),
        b = Math.atan((p3x - p2x) / Math.abs(p2y - p3y));
        a = p1y < p2y ? Math.PI - a : a;
        b = p3y < p2y ? Math.PI - b : b;
        var alpha = Math.PI / 2 - ((a + b) % (Math.PI * 2)) / 2,
        dx1 = l1 * Math.sin(alpha + a),
        dy1 = l1 * Math.cos(alpha + a),
        dx2 = l2 * Math.sin(alpha + b),
        dy2 = l2 * Math.cos(alpha + b);
        return {
            x1: p2x - dx1,
            y1: p2y + dy1,
            x2: p2x + dx2,
            y2: p2y + dy2
        };
    }
    
    function drawPath() {
        for (var j = 0, jj = X.length - 1; j < jj; j++) {
            if (j) {
                var a = getAnchors(X[j - 1], Y[j - 1], X[j], Y[j], X[j + 1], Y[j + 1]);
                p = p.concat([a.x1, a.y1, X[j], Y[j], a.x2, a.y2]);
            } else {
                p = ["M", X[j], Y[j], "C", X[j], Y[j]];
            }
        }
        p = p.concat([X[jj], Y[jj], X[jj], Y[jj]]);
        var subaddon = "L" + (W - 10) + "," + (H - 10) + ",50," + (H - 10) + "z";
        path.attr({path: p});
        sub.attr({path: p + subaddon});
    }
    
    var p = [["M"].concat(translate(0, values[0]))],
    color = "hsb(240°, 1, 1)",
    X = [],
    Y = [],
    blankets = r.set(),
    buttons = r.set(),
    labels = r.set(),
    w = (W - 60) / values.length,
    isDrag = -1,
    start = null,
    sub = r.path().attr({stroke: "none", fill: [90, color, color].join("-"), opacity: 0}),
    path = r.path().attr({stroke: color, "stroke-width": 2}),
    unhighlight = function () {};
    var ii;
    var labelSynth = [];
    for (i = 0, ii = values.length - 1; i < ii; i++) {
        var xy = translate(i, values[i]),
        xy1 = translate(i + 1, values[i + 1]),
        f;
        X[i] = xy[0];
        Y[i] = xy[1];
        (f = function (i, xy) {
            labels.push(r.text(xy[0], xy[1]-15, Math.round(H-xy[1]).toString() + "Hz"));
            buttons.push(r.circle(xy[0], xy[1], 5).attr({fill: color, stroke: "none"}));
            blankets.push(r.circle(xy[0], xy[1], w / 2).attr({stroke: "none", fill: "#fff", opacity: 0}).mouseover(function () {
                if (isDrag + 1) {
                    unhighlight = function () {};
                } else {
                    buttons.items[i].animate({r: 10, fill: "#ff0000"}, 200);
                }
            }).mouseout(function () {
                if (isDrag + 1) {
                    unhighlight = function () {
                        buttons.items[i].animate({r: 5, fill: color}, 200);
                    };
                } else {
                    buttons.items[i].animate({r: 5, fill: color}, 200);
                }
            }).drag(function (dx, dy) {
                var start = this.start;
                start && update(start.i, start.p + dy);
            }, function (x, y) {
                this.start = {i: i, m: y, p: Y[i]};
            }));
            blankets.items[blankets.items.length - 1].node.style.cursor = "move";
        })(i, xy);
        if (i == ii - 1) {
            f(i + 1, xy1);
        }
    }
    xy = translate(ii, values[ii]);

    X.push(xy[0]);
    Y.push(xy[1]);
    drawPath();
    var update = function (i, d) {
        (d > H - 10) && (d = H - 10);
        (d < 10) && (d = 10);
        Y[i] = d;
        drawPath();
        labels.items[i].attr({y: d-15, text: Math.round(H-d).toString() + "Hz"});
        frequencyPattern.pattern.list[i] = H-d;
        buttons.items[i].attr({cy: d});
        blankets.items[i].attr({cy: d});
        r.safari();
    };
};