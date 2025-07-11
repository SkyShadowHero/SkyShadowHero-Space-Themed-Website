// 星空背景设置
const STAR_NUM = 120; // 星星数量
const STAR_COLOR = "#fff";
const STAR_SIZE = 1.2;
const STAR_MIN_OPACITY = 0.2;
const STAR_MAX_OPACITY = 1;
const STAR_SPEED = 0.04; // 星星移动速度更快

let stars = [];
let gradientAngle = 0;

// 生成星星
function createStars(width, height) {
    stars = [];
    for (let i = 0; i < STAR_NUM; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * STAR_SIZE + 0.7,
            opacity: Math.random() * (STAR_MAX_OPACITY - STAR_MIN_OPACITY) + STAR_MIN_OPACITY,
            twinkle: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.03 + 0.015, // 闪烁速度更快
            vx: (Math.random() - 0.5) * 0.25, // X方向速度更大
            vy: (Math.random() - 0.5) * 0.25  // Y方向速度更大
        });
    }
}

// 绘制星空背景
function drawStarBackground(ctx, width, height) {
    // 更自然的径向渐变
    gradientAngle += 0.01;
    let r = Math.max(width, height) * 0.6;
    let cx = width / 2 + Math.cos(gradientAngle) * 40; // 中心微微漂移
    let cy = height / 2 + Math.sin(gradientAngle) * 40;
    let gradient = ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, r
    );
    gradient.addColorStop(0, "#23243a");
    gradient.addColorStop(0.3, "#1a2250");
    gradient.addColorStop(0.6, "#0a0c1b");
    gradient.addColorStop(1, "#181c2a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 星星移动和闪烁
    for (let star of stars) {
        // 星星移动
        star.x += star.vx;
        star.y += star.vy;

        // 边界循环
        if (star.x < 0) star.x += width;
        if (star.x > width) star.x -= width;
        if (star.y < 0) star.y += height;
        if (star.y > height) star.y -= height;

        // 闪烁（允许熄灭，最低为0）
        star.twinkle += star.speed;
        let opacity = star.opacity + Math.sin(star.twinkle) * 1.0; // 幅度更大
        opacity = Math.max(0, Math.min(STAR_MAX_OPACITY, opacity)); // 允许为0
        if (opacity > 0.01) { // 熄灭时不绘制
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
            ctx.fillStyle = STAR_COLOR;
            ctx.shadowColor = STAR_COLOR;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }
    }
}
// --- 地球动画设置 ---
settings = {
    POINTS : 200,
    RADIUS : 200,
    ROTATION : 0.006,
    MAX_SPEED : 2,
    FOV : 400,
    Z_MAX : 388,
    MAX_SPEED : 0.015,
    MAX_FORCE : 0.10,
    MAX_SIZE : 5,
    DESIRED_SEPARATION : .5,
    NEIGHBOR_RADIUS : 50,
    SEPARATION_WEIGHT : 2,
    ALIGNMENT_WEIGHT : 1,
    COHESION_WEIGHT : 1
};

var PointStyle = {
    earth : 0,
    water : 1,
    cloud : 2
}

var Radii = [140, 120, 170];
var Scales = [15, 20, 6];
var colors = ['#27ae60', '#2980b9', '#ecf0f1']; 

Scene = function(canvas_id) {
    this.init(canvas_id);
};

Scene.prototype.init = function(canvas_id) {

    this.current_time = new Date().getTime();
    this.dt = 0;
    this.canvas = document.getElementById(canvas_id);

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.ctx = this.canvas.getContext('2d');

    // 初始化星星
    createStars(this.width, this.height);

    this.points = new Array();
    this.clouds = new Array();

    //water/earth
    for(var i = 0; i < 1800; i++)
    {
        if(i > 1600)
            type = 0;
        else
            type = 1;

        theta = Math.random()*2*Math.PI;
        phi = Math.acos(Math.random()*2-1);
        x0 = Radii[type]*Math.sin(phi)*Math.cos(theta);
        y0 = Radii[type]*Math.sin(phi)*Math.sin(theta);
        z0 = Radii[type]*Math.cos(phi);
        var sign = Math.random() > 0.5 ? 1 : -1;

        vel = new Vector();

        var point = new Point(
            new Vector(x0, y0, z0),
            vel,
            theta,
            phi,
            this.ctx);

        point.type = type;

        this.points.push(point);
    }

    //clouds
    for(var i = 0; i < 200; i++)
    {
        var type = 2;
        theta = Math.random()*2*Math.PI;
        phi = Math.acos(Math.random()*2-1);
        x0 = Radii[type]*Math.sin(phi)*Math.cos(theta);
        y0 = Radii[type]*Math.sin(phi)*Math.sin(theta);
        z0 = Radii[type]*Math.cos(phi);
        var sign = Math.random() > 0.5 ? 1 : -1;

        var vel = new Vector(sign*Math.random()/200, sign*Math.random()/200, 0);

        var point = new Point(
            new Vector(x0, y0, z0), 
            vel,
            theta,
            phi,
            this.ctx);

        point.type = type;

        this.clouds.push(point);
    }
};

Scene.prototype.enable = function() {
    var that = this;

    window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     
    })();

    this.animate(new Date().getTime());

    function doResize()
    {
        that.canvasResize();
        // 重新生成星星
        createStars(that.width, that.height);
    }

    var endResize;

    window.onresize = function(e) {
        clearTimeout(endResize);
        endResize = setTimeout(doResize, 100);
    };

    return this;
};

Scene.prototype.animate = function(time)
{
    var that = this;
    this.animationFrame = requestAnimFrame( function(){ that.animate(new Date().getTime());} );
    this.update(time);
};

Scene.prototype.disable = function() {
    window.cancelAnimationFrame(this.animationFrame);
    return this;
};

Scene.prototype.canvasResize = function()
{
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.width = this.canvas.width;
    this.height = this.canvas.height;
};

Scene.prototype.update = function(time) {
    this.dt = time - this.current_time;

    this.current_time = time;

    // 绘制星空背景
    drawStarBackground(this.ctx, this.width, this.height);

    for (i in this.points) {
        this.points[i].step();
    }

    this.points.sort(zSort);

    for (i in this.points) {
        this.points[i].draw();
    }

    for (i in this.clouds) {
        this.clouds[i].step(this.clouds);
    }

    this.clouds.sort(zSort);

    for (i in this.clouds) {
        this.clouds[i].draw();
    }

};


Scene.prototype.draw = function()
{
    // 已由drawStarBackground覆盖，无需再填充
};

Point = function(location, velocity, theta, phi, ctx){
    this.init(location, velocity, theta, phi, ctx);
};

Point.prototype.init = function(location, velocity, theta, phi, ctx){
    this.pos = location.copy();
    this.vel = velocity.copy();
    this.theta = theta;
    this.phi = phi;
    this.ctx = ctx;
};

Point.prototype.step = function(neighbors)
{
    if(this.type == PointStyle.cloud)
    {
        var z = this.pos.z;
        var acceleration = this.flock(neighbors);
        this.vel.add(acceleration).limit(settings.MAX_SPEED);
        this.pos.add(this.vel);
        this.pos.z = z;
        this.rotateX(this.vel.x);
        this.rotateY(this.vel.y);
        this.rotateY(settings.ROTATION/2);
    }else{
        this.rotateY(settings.ROTATION);
    }  
};

Point.prototype.rotateY = function(angle)
{
    x = this.pos.x; 
    z = this.pos.z; 
    
    cosRY = Math.cos(angle);
    sinRY = Math.sin(angle);
    tempz = z; 
    tempx = x; 

    
    x= (tempx*cosRY)+(tempz*sinRY);
    z= (tempx*-sinRY)+(tempz*cosRY);
    this.pos.x = x; 
    this.pos.z = z;
};

Point.prototype.rotateX = function(angle)
{
    y = this.pos.y; 
    z = this.pos.z; 
    
    cosRY = Math.cos(angle);
    sinRY = Math.sin(angle);
    tempz = z; 
    tempy = y; 

    
    y= (tempy*cosRY)+(tempz*sinRY);
    z= (tempy*-sinRY)+(tempz*cosRY);
    this.pos.y = y; 
    this.pos.z = z;
};

Point.prototype.rotateZ = function(angle)
{
    x = this.pos.x; 
    y = this.pos.y; 
    
    cosRY = Math.cos(angle);
    sinRY = Math.sin(angle);
    tempy = y; 
    tempx = x; 

    
    x= (tempx*cosRY)+(tempy*sinRY);
    y= (tempx*-sinRY)+(tempy*cosRY);
    this.pos.x = x; 
    this.pos.y = y;
}

Point.prototype.flock = function(neighbors)
{
    var separation = this.separate(neighbors).multiply(settings.SEPARATION_WEIGHT);
    var alignment = this.align(neighbors).multiply(settings.ALIGNMENT_WEIGHT);
    var cohesion = this.cohere(neighbors).multiply(settings.COHESION_WEIGHT);

    return separation.add(alignment).add(cohesion);
};

Point.prototype.cohere = function(neighbors){
    var sum = new Vector(0, 0);
    var count = 0;

    for(boid in neighbors)
    {
        var d = this.pos.distance(neighbors[boid].pos);
        if(d > 0 && d < settings.NEIGHBOR_RADIUS)
        {
            if(Math.abs(this.pos.z - neighbors[boid].pos.z) < 20)
            {
                sum.add(neighbors[boid].pos);
                count++;
            }
        }
    }

    if( count > 0)
        return this.steer_to(sum.divide(count));
    else
        return sum;
};

Point.prototype.steer_to = function(target)
{
    var desired = Vector.subtract(target, this.pos);
    var d = desired.magnitude();
    var steer;

    if(d > 0)
    {
        desired.normalize();

        if(d < 100)
            desired.multiply(settings.MAX_SPEED*(d/100));
        else
            desired.multiply(settings.MAX_SPEED);

        steer = desired.subtract(this.vel);
        steer.limit(settings.MAX_FORCE);
    }else{
        steer = new Vector(0, 0);
    }

    return steer;
};

Point.prototype.align = function(neighbors){
    var mean = new Vector();
    var count = 0;
    for(boid in neighbors)
    {
        var d = this.pos.distance(neighbors[boid].pos);
        if(d > 0 && d < settings.NEIGHBOR_RADIUS)
        {
            if(Math.abs(this.pos.z - neighbors[boid].pos.z) < 20)
            {
                mean.add(neighbors[boid].vel);
                count++;
            }
        }
    }

    if (count > 0)
        mean.divide(count)
    
    mean.limit(settings.MAX_FORCE);

    return mean;
};

Point.prototype.separate = function(neighbors){
    var mean = new Vector();
    var count = 0;

    for(boid in neighbors)
    {
        var d = this.pos.distance(neighbors[boid].pos);
        if(d > 0 && d < settings.DESIRED_SEPARATION)
        {
            if(Math.abs(this.pos.z - neighbors[boid].pos.z) < 20)
            {
                mean.add(Vector.subtract(this.pos, neighbors[boid].pos).normalize().divide(d));
                count++;
            }
        }
    }

    if (count > 0)
        mean.divide(count);

    return mean;
};

Point.prototype.draw = function(){

    x3d = this.pos.x;
    y3d = this.pos.y; 
    z3d = this.pos.z; 
    var scale = settings.FOV/(settings.FOV+z3d); 
    var x2d = (x3d * scale) + this.ctx.canvas.width/2; 
    var y2d = (y3d * scale)  + this.ctx.canvas.height/2;

    if(this.pos.z > 25)
        return;

    this.ctx.save();
    this.ctx.fillStyle = colors[this.type];   
    this.ctx.beginPath();
    this.ctx.arc(x2d, y2d, Math.abs(scale*Scales[this.type]), 0, 2*Math.PI, false);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();
};

// Vector 实现
Vector = (function() {
    var name, _fn, _i, _len, _ref;
    _ref = ['add', 'subtract', 'multiply', 'divide'];
    _fn = function(name) {
        return Vector[name] = function(a, b) {
            return a.copy()[name](b);
        };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _fn(name);
    }
    function Vector(x, y, z) {
        var _ref;
        if (x == null) {
            x = 0;
        }
        if (y == null) {
            y = 0;
        }
        if (z == null) {
            z = 0;
        }
        _ref = [x, y, z], this.x = _ref[0], this.y = _ref[1], this.z = _ref[2];
    }
    Vector.prototype.copy = function() {
        return new Vector(this.x, this.y, this.z);
    };
    Vector.prototype.magnitude = function() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    Vector.prototype.normalize = function() {
        var m;
        m = this.magnitude();
        if (m > 0) {
            this.divide(m);
        }
        return this;
    };
    Vector.prototype.limit = function(max) {
        if (this.magnitude() > max) {
            this.normalize();
            return this.multiply(max);
        } else {
            return this;
        }
    };
    Vector.prototype.heading = function() {
        return -1 * Math.atan2(-1 * this.y, this.x);
    };
    Vector.prototype.eucl_distance = function(other) {
        var dx, dy, dz;
        dx = this.x - other.x;
        dy = this.y - other.y;
        dz = this.z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };
    Vector.prototype.distance = function(other, dimensions) {
        var dx, dy, dz;
        if (dimensions == null) {
            dimensions = false;
        }
        dx = Math.abs(this.x - other.x);
        dy = Math.abs(this.y - other.y);
        dz = Math.abs(this.z - other.z);
        if (dimensions) {
            dx = dx < dimensions.width / 2 ? dx : dimensions.width - dx;
            dy = dy < dimensions.height / 2 ? dy : dimensions.height - dy;
        }
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    };
    Vector.prototype.subtract = function(other) {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    };
    Vector.prototype.add = function(other) {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    };
    Vector.prototype.divide = function(n) {
        var _ref;
        _ref = [this.x / n, this.y / n, this.z / n], this.x = _ref[0], this.y = _ref[1], this.z = _ref[2];
        return this;
    };
    Vector.prototype.multiply = function(n) {
        var _ref;
        _ref = [this.x * n, this.y * n, this.z * n], this.x = _ref[0], this.y = _ref[1], this.z = _ref[2];
        return this;
    };
    Vector.prototype.dot = function(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    };
    Vector.prototype.projectOnto = function(other) {
        return other.copy().multiply(this.dot(other));
    };
    Vector.prototype.wrapRelativeTo = function(location, dimensions) {
        var a, d, key, map_d, v, _ref;
        v = this.copy();
        _ref = {
            x: "width",
            y: "height"
        };
        for (a in _ref) {
            key = _ref[a];
            d = this[a] - location[a];
            map_d = dimensions[key];
            if (Math.abs(d) > map_d / 2) {
                if (d > 0) {
                    v[a] = (map_d - this[a]) * -1;
                } else {
                    v[a] = this[a] + map_d;
                }
            }
        }
        return v;
    };
    Vector.prototype.invalid = function() {
        return (this.x === Infinity) || isNaN(this.x) || this.y === Infinity || isNaN(this.y) || this.z === Infinity || isNaN(this.z);
    };
    return Vector;
})();

function initialize() {
    scene = new Scene("c");
    scene.enable();
}

function zSort (a, b) {
    return (b.pos.z - a.pos.z);
}

window.onload = function() {
    initialize();
    
    // 添加滚动效果
    $(".scroll-down").click(function() {
        $('html, body').animate({
            scrollTop: $(".profile-section").offset().top
        }, 800);
    });
};

function spaceshipStraighten(el) {
  el.style.transform = "rotateY(0deg) rotateX(0deg) scale(1.08)";
}
function spaceshipTilt(el) {
  el.style.transform = "rotateY(18deg) rotateX(10deg) scale(1.04)";
}
// 页面加载时自动倾斜
window.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('spaceship');
  if (el) spaceshipTilt(el);
});