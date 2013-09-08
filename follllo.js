function Start(gs, world, banner) {
    var x, y, w, h;
    this.draw = function(c) {
        c.font = "20px sans-serif";
        c.fillStyle = "red";
        var metrics = c.measureText(banner);
        x = (gs.width - metrics.width) / 2;
        y = gs.height / 2;
        w = metrics.width;
        h = 40;
        c.fillText(banner, x, y);
    };
    this.pointerBox = function() { return [x, y, x+w, y+h]; };
    this.pointerMove = function() { 
        world.goActive();
        gs.delEntity(this); 
    };
}

function Timer(gs, world, frames) {
    var started = false;
    this.start = function() { started = true; };
    this.update = function() {
        if (started) {frames -= 1;}
        if (frames <= 0) {world.win();}
    };
    this.draw = function(c) {
        c.fillStyle = "#ff8000";
        c.font = "20px sans-serif";
        c.fillText("" + frames, 30, 30);
    };
}

function Dot(gs, world) {
    var counter = -1;
    var x,y;
    
    this.active = true;
    
    this.update = function() {
        if (this.active) {
            counter += 1;
            /* stash vars now so that they're never invalid if counter goes away */
            if (counter >= world.track.length) {counter = world.track.length - 1;}
            x = world.track[counter][0];
            y = world.track[counter][1];
        }
    };
    this.draw = function(c) {
        c.fillStyle = "red";
        c.fillRect(x, y, 10, 15);
    };
    this.get_collision_aabb = function() {
        if (counter < 0) {return [-1,-1,1,1];}
        return [x, y, 10, 15];
    };
}

function Explosion(gs, position) {
    counter = 10;
    this.update = function() {
        this.priority = 999999;
        gs.sortEntities();
        counter -= 1;
        if (counter <= 0) {
            gs.delEntity(this);
        }
    };
    this.draw = function(c) {
        c.fillStyle = "red";
        c.beginPath();
        c.arc(position[0], position[1], 25, 0, Math.PI * 2);
        c.closePath();
        c.fill();
    };
}

function Container(gs, details) {
    this.inside = false;
    this.update = function() { this.inside = false; };
    this.draw = function(c) {
        c.fillStyle = "black";
        c.beginPath();
        c.moveTo(details.poly[0][0], details.poly[0][1]);
        for (var i=1; i<details.poly.length; i++) {
            c.lineTo(details.poly[i][0], details.poly[i][1]);
        }
        c.fill();
        c.stroke();
    };
    
    this.pointerPoly = function() { return details.poly; };
    this.pointerMove = function() { this.inside = true; };
}

function World(gs) {
    var level = -1;
    active = false;
    var container, timer, dots, counter;
    this.track = [];
    
    var levels = [
        {
            poly: [[50,50],[270,50],[270,430],[50,430]],
            time: 100,
            fire_every: 60
        },
        {
            poly: [[110, 90], [210, 90], [210, 170], [170, 170], [170, 210], [190, 210], [190, 190], [270, 190], [270, 270], [190, 270], [190, 250], [170, 250], [170, 290], [210, 290], [210, 370], [110, 370], [110, 290], [150, 290], [150, 250], [130, 250], [130, 270], [50, 270], [50, 190], [130, 190], [130, 210], [150, 210], [150, 170], [110, 170]],
            time: 100,
            fire_every: 120
        }
    ];
    
    this.goActive = function() {
        timer.start();
        active = true;
    };
    
    this.win = function() {
        gs.delEntity(container);
        gs.delEntity(timer);
        emptyDots();
        level += 1;
        if (level >= levels.length) {
            active = false;
            document.getElementById("banner").innerHTML = "you win!";
            document.getElementById("banner").style.display = "block";
            return;
        }
        document.getElementById("banner").innerHTML = "level " + (level + 1) + " last for a count of " + levels[level].time;
        document.getElementById("banner").style.display = "block";
        startLevel(this, true);
    };
    
    this.lose = function() {
        gs.delEntity(container);
        gs.delEntity(timer);
        emptyDots();
        startLevel(this, false);
    };
    
    this.pointerBox = function() { return [0, 0, gs.width, gs.height]; };
    this.pointerMove = function() { 
        if (!container.inside) {
            if (active) {
                active = false;
                gs.delEntity(container);
                gs.delEntity(timer);
                emptyDots();
                startLevel(this, false);
            }
        } 
    };
    
    emptyDots =  function() {
        for (var i=0; i<dots.length; i++) {
            dots[i].active = false;
            gs.delEntity(dots[i]);
        }
    };
    
    startLevel = function(self, succeeded) {
        self.track = [];
        dots = [];
        counter = 0;
        active = false;
        container = new Container(gs, levels[level]);
        gs.addEntity(container);
        timer = new Timer(gs, self, levels[level].time);
        gs.addEntity(timer);
        gs.addEntity(new Start(gs, self, succeeded ? "START": "TRY AGAIN"));
    };
    
    this.update = function() {
        if (level == -1) {
            level = 0;
            startLevel(this, true);
        }
        if (active) {
            this.track.push(gs.pointerPosition);
            counter += 1;
            if (counter >= levels[level].fire_every) {
                var dot = new Dot(gs, this);
                gs.addEntity(dot);
                dots.push(dot);
                counter = 0;
            }
            function Pointer(world) {
                this.get_collision_aabb = function() {
                    return [gs.pointerPosition[0], gs.pointerPosition[1], 10, 15];
                };
                this.collide_aabb = function(other, result) {
                    gs.addEntity(new Explosion(gs, gs.pointerPosition));
                    world.lose();
                };
            }
            var pointer = new Pointer(this);
            collide.aabb([pointer], dots);
        }
    };
}


function startGame() {
    var surface = document.getElementById("surface");
    var gs = new JSGameSoup(surface, 30);
    gs.addEntity(new World(gs));
    document.getElementById("banner").innerHTML = "level 1: last for a count of 100";
    document.getElementById("banner").style.display = "block";
    document.getElementById("banner").onclick = function() { this.style.display = "none"; };
    gs.launch();
    /* jsgs redefines this unconditionally. sigh. */
    document.getElementsByTagName("canvas")[0].style.cursor = "url(curs.gif), auto";
}

