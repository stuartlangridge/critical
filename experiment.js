function Score(gs, x, y, score) {
    var opacity = 1.0;
    
    this.draw = function(c) {
        c.fillStyle = "rgba(0,0,0," + opacity + ")";
        c.font = "8px Ubuntu";
        c.fillText(score, x, y);
    }
    
    this.update = function() {
        opacity -= 0.05;
        if (opacity < 0) {
            gs.delEntity(this);
        }
    }
}

function Laser(gs, x, y, xdir, ydir, explosion_score) {
    var opacity = 1.0;
    this.explosion_score = explosion_score;
    var ex, ey, w, h;
    if (xdir == -1) { ex = 0; ey = y - 5; w = x; h = 10; }
    if (xdir == 1) { ex = x; ey = y - 5; w = gs.width - x; h = 10 }
    if (ydir == -1) { ex = x - 5; ey = 0; w = 10; h = y }
    if (ydir == 1) { ex = x - 5; ey = y; w = 10; h = gs.height - y }
    
    this.update = function() {
        opacity -= 0.5;
        if (opacity <= 0) {
            gs.delEntity(this);
        } else {
            collide.aabb([this], DOTS);
        }
    }
    
    this.draw = function(c) {
        c.fillStyle = "rgba(255,255,0," + opacity + ")";
        c.fillRect(ex,ey,w,h);
    }
    
    this.get_collision_aabb = function() {
        return [ex, ey, w, h];
    }
}

function Shrapnel(gs, x, y, xd, yd, explosion_score) {
    var r = 3;
    var speed = 5;
    var col = "rgba(0,0,255,opac)";
    var power = 15;
    var max_power = power;
    this.explosion_score = explosion_score;
    
    this.update = function() {
        var remove = false;
        power -= 1;
        if (power < 0) remove = true;
        x += xd * speed;
        if ((x > gs.width) || (x < 0)) remove = true;
        y += yd * speed;
        if ((y > gs.height) || (y < 0)) remove = true;
        if (remove) {
            gs.delEntity(this);
        } else {
            collide.circles([this], DOTS);
        }
    }
    
    this.draw = function(c) {
        var opac = power / max_power;
        c.fillStyle = col.replace("opac", opac);
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.closePath();
        c.fill();
    }
    
    this.get_collision_circle = function() {
        return [[x,y], r];
    }
    
    this.collide_circle = function(other, result) {
        power -= 3; // colliding makes shapnel less powerful
    }
}

function Dot(gs) {
    var r = 9;
    var x = Math.round((gs.width - r - r) * Math.random()) + r;
    var y = Math.round((gs.height - r - r) * Math.random()) + r;
    var xd = Math.random() < 0.5 ? -1 : 1;
    var yd = Math.random() < 0.5 ? -1 : 1;
    var speed = Math.round(Math.random() * 3) + 1;
    var col = "rgb(255,0,0)";
    var explosion_pending = false;
    var explosion_score = 100;
    var lives = 1;

    this.explode = function() {
        gs.delEntity(this);
        gs.addEntity(new Shrapnel(gs, x, y, -1, -1, explosion_score + 100));
        gs.addEntity(new Shrapnel(gs, x, y, -1, 1, explosion_score + 100));
        gs.addEntity(new Shrapnel(gs, x, y, 1, -1, explosion_score + 100));
        gs.addEntity(new Shrapnel(gs, x, y, 1, 1, explosion_score + 100));
        gs.addEntity(new Score(gs, x, y, explosion_score));
        SCORE.score += explosion_score;
        AM.play("bomb");
    }
    
    this.explode_old = function() {
        gs.delEntity(this);
        gs.addEntity(new Laser(gs, x, y, -1, 0, explosion_score + 100));
        gs.addEntity(new Laser(gs, x, y, 1, 0, explosion_score + 100));
        gs.addEntity(new Laser(gs, x, y, 0, -1, explosion_score + 100));
        gs.addEntity(new Laser(gs, x, y, 0, 1, explosion_score + 100));
        gs.addEntity(new Score(gs, x, y, explosion_score));
        SCORE.score += explosion_score;
        AM.play("electricity");
    }
    
    this.update = function() {
        if (explosion_pending) {
            this.explode();
            return;
        }
        x += xd * speed;
        if (x >= gs.width - r - 2) {
            xd = -xd;
            x = gs.width - r - 2;
        }
        if (x <= r) {
            xd = -xd;
            x = r;
        }
        y += yd * speed;
        if (y >= gs.height - r - 2) {
            yd = -yd;
            y = gs.height - r - 2;
        }
        if (y <= r) {
            yd = -yd;
            y = r;
        }
    }

    this.draw = function(c) {
        c.fillStyle = "rgb(255,255,255)";
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.closePath();
        c.fill();
        c.fillStyle = "rgb(0,0,0)";
        c.beginPath();
        c.arc(x, y, r-1, 0, Math.PI * 2);
        c.closePath();
        c.fill();
        c.fillStyle = "rgba(255,0,0,1.0)"; // + (lives/4) + ")";
        c.beginPath();
        c.arc(x, y, r-4, 0, Math.PI * 2);
        c.closePath();
        c.fill();
    }
    
    this.pointerCircle = function() {
        return [x, y, r];
    }
    
    this.pointerDown = function(i) {
        this.set_to_explode(explosion_score);
    }
    
    this.get_collision_circle = function() {
        return [[x,y], r+3];
    }
    
    this.get_collision_aabb = function() {
        return [x-r + 3,y-r + 3,r*2 - 6,r*2 - 6];
    }

    this.collide_circle = function(other, result) {
        this.set_to_explode(other.explosion_score);
    }
    
    this.collide_aabb = function(other, result) {
        this.set_to_explode(other.explosion_score);
    }

    this.set_to_explode = function(score) {
        lives -= 1;
        if (lives <= 0) {
            explosion_pending = true;
            explosion_score = score;
        }
    }

}



function TotalScore(gs) {
    this.score = 0;
    this.draw = function(c) {
        c.fillStyle = "rgb(0,0,0)";
        c.font = "20pt Ubuntu";
        c.fillText(this.score, 0, 50);
    }
}

var DOTS = [], SCORE;
var AM = new AudioManager();
AM.load("http://www.mediacollege.com/downloads/sound-effects/explosion/bomb-03.wav", "bomb");
AM.load("http://awdpro.com/Sound%20Effects/electricity_1.wav", "electricity");
function startGame() {
    var surface = document.getElementById("surface");
    var gs = new JSGameSoup(surface, 30);
    for (var i=0; i<70; i++) {
        var dot = new Dot(gs);
        DOTS.push(dot);
        gs.addEntity(dot);
    }
    SCORE = new TotalScore(gs);
    gs.addEntity(SCORE);
    gs.launch();
}

