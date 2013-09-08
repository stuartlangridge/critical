function Explosion(gs, x, y) {
    this.maxr = 45;
    var r = this.maxr;
    this.x = x;
    this.y = y;
    
    this.update = function() {
        if (r == this.maxr) {
            collide.circles([this], DOTS);
        }
        r -= 5;
        if (r <= 0) {
            gs.delEntity(this);
        }
    };
    
    this.draw = function(c) {
        c.shadowColor = "rgb(255,255,0)";
        c.shadowBlur = r + 20;
        opac = (r / this.maxr);
        c.fillStyle = "rgba(255,255,255," + opac + ")";
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.closePath();
        c.fill();
    };

    this.get_collision_circle = function() {
        return [[x,y], r];
    };
    

}

function Dot(gs, fullness, dotcolour, startx, starty) {
    var r = 9;
    var x = Math.round((gs.width - r - r) * Math.random()) + r;
    if (startx !== undefined) { x = startx; }
    var y = Math.round((gs.height - r - r) * Math.random()) + r;
    if (starty !== undefined) { y = starty; }
    var xd = Math.random() < 0.5 ? -1 : 1;
    var yd = Math.random() < 0.5 ? -1 : 1;
    var xspeed = Math.round(Math.random() * 3) + 1;
    var yspeed = Math.round(Math.random() * 3) + 1;
    var increments = [];
    this.dying = false;

    this.update = function() {
        if (increments.length > 0) {
            for (var i=0; i<increments.length; i++) {
                var inc = increments[i].shift();
                if (inc !== undefined) {
                    fullness += inc;
                }
            }
        }
        if (fullness >= 1.0) {
            this.explode();
            return;
        }
        x += xd * xspeed;
        if (x >= gs.width - r - 2) {
            xd = -xd;
            x = gs.width - r - 2;
        }
        if (x <= r) {
            xd = -xd;
            x = r;
        }
        y += yd * yspeed;
        if (y >= gs.height - r - 2) {
            yd = -yd;
            y = gs.height - r - 2;
        }
        if (y <= r) {
            yd = -yd;
            y = r;
        }
    };

    this.draw = function(c) {
        c.shadowColor = "rgba(255,255,255," + fullness + ")";
        c.shadowBlur = [0,0,0,0,1,1,1,4,7,10,25][Math.round(fullness * 10)];
        c.fillStyle = dotcolour;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.closePath();
        c.fill();
        c.fillStyle = "rgba(255,255,255," + fullness + ")";
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.closePath();
        c.fill();
    };

    this.get_collision_circle = function() {
        return [[x,y], r];
    };
    
    this.collide_circle = function(other, result) {
        // calculate direction change from the position of other, the explosion
        if (x < other.x) { xd = -1; xspeed = (1 - ((other.x - x) / other.maxr)) * 3; }
        if (x >= other.x) { xd = 1; xspeed = (1 - ((x - other.x) / other.maxr)) * 3; }
        if (y < other.y) { yd = -1; yspeed = (1 - ((other.y - y) / other.maxr)) * 3; }
        if (y >= other.y) { yd = 1; yspeed = (1 - ((y - other.y) / other.maxr)) * 3; }
        // increment the fullness of this because it was caught in the explosion
        var incr = 0.4; var steps = 40;
        increments.push(rept(incr/steps, steps));
        if (fullness + incr > 1.0) { this.dying = true; }
    };

    this.explode = function() {
        gs.delEntity(this);
        gs.addEntity(new Explosion(gs, x, y));
        AM.play("bomb");
    };
}

function World(gs) {
    this.clicked = false;

    this.pointerDown = function(i) {
        if (!this.clicked) {
            gs.addEntity(new Dot(gs, 1.0, "rgb(255,255,255)", gs.pointerPosition[0], gs.pointerPosition[1]));
            this.clicked = true;
        }
    };
    this.pointerTest = function(pos) {
        return true;
    };
    
    this.draw = function(c) {
        var alive = 0;
        var dying = 0;
        for (var i=0; i<DOTS.length; i++) {
            var islive = gs.inEntities(DOTS[i]);
            if (islive) {alive += 1;}
            if (islive && DOTS[i].dying) {dying += 1;}
        }
        c.fillStyle = "rgb(255,255,0)";
        c.fillText(alive + "/" + DOTS.length + "/" + dying, 50, 50);
        if (this.clicked) {
            var trg = LEVELS[LEVEL].target;
            if (trg < 0) {
                
            } else {
                if (alive + trg <= DOTS.length) {
                    //LEVEL += 1;
                    //gs.clearEntities();
                    //showBanner(gs, "winn0r!");
                } else {
                    if (dying == 0) {
                        //gs.clearEntities();
                        //showBanner(gs, "dude.<br>fail.");
                    }
                }
            }
        }
    };
}

function rept(thing, times) {
    var l = [];
    for (var i=0; i<times; i++) {
        l.push(thing);
    }
    return l;
}

var AM = new AudioManager();
AM.load("http://www.mediacollege.com/downloads/sound-effects/explosion/bomb-03.wav", "bomb");

var DOTS = [];

var LEVELS = [
    {dots: [[50, 0.6], [30, 0.2]], target: 5, dotcolour: "rgb(0,0,255)"},
    {dots: [[60, 0.2], [5, 0.6]], target: -5, dotcolour: "rgb(255,0,0)"},
];

var LEVEL = 0, world;

if(navigator.userAgent.match(/Android/i)){
    window.scrollTo(0,1);
}

function startLevel(gs) {
    world = new World(gs);
    gs.addEntity(world);
    DOTS = [];
    var thislevel = LEVELS[LEVEL];
    for (var i=0; i<thislevel.dots.length; i++) {
        for (var dots=0; dots<thislevel.dots[i][0]; dots++) {
            var dot = new Dot(gs, thislevel.dots[i][1], thislevel.dotcolour);
            DOTS.push(dot);
            gs.addEntity(dot);
        }
    }
}

function showBanner(gs, text) {
    var txt = text;
    var lvl = LEVELS[LEVEL];
    if (text === null) {
        if (lvl.target < 0) {
            txt = "kill<br><i>all but</i> " + (0-lvl.target) + "<br>dots";
        } else {
            txt = "kill<br>" + (lvl.target) + "<br>dots";
        }
    }
    document.querySelector("#banner p").innerHTML = txt;
    document.getElementById("banner").className = "showing";
    setTimeout(hideBanner(gs), 2000);
}

function hideBanner(gs) {
    return function() {
        document.getElementById("banner").className = "";
        startLevel(gs);
    };
}

function startGame() {
    document.getElementById("banner").onclick = document.getElementById("banner").onmouseover = hideBanner(gs);

    var surface = document.getElementById("surface");
    var gs = new JSGameSoup(surface, 30);
    showBanner(gs, null);
    gs.launch();
}
