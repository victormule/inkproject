   
    var numpts = 30;
    var ctx,
    z = 55, 
    pscale = 0.4,
    space = 1,
    dist = 1000, points = [],  
    mouse=false, 
    rx=Math.PI/-5, ry=0;
    var lastx, lasty;
    var color = 250, colordepth = 3;
    var last = new Date().getTime();
    var impulse = 1,raining=true, wavespeed = 30, h=18, damp = 0.99, rtype='box';
    
    function Point(x,y,z,scale, color, alpha, vel) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.sx = 0;
        this.sy = 0;
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
        this.scale = scale || 1;
        this.sscale = 1;
        this.color = color || "#00f";
        this.vy = 0;
    }
    
    function render() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        if(points.length != numpts*numpts)return;//middle of an update
        
        for(var i = numpts; i < points.length-numpts;i++) {
            
            transform(points[i]);
            
            if(rtype === 'circle')
                drawCircle(points[i].sx, points[i].sy, points[i].scale*points[i].sscale, 1, points[i].color);
            
            if(rtype === 'box')
                drawBox(points[i].sx, points[i].sy, points[i].scale*points[i].sscale, 1, points[i].color);
            
            if(rtype === 'line') {
                if((i+1)%numpts !==0) {
                    drawLine(points[i].sx, points[i].sy, points[i+1].sx, points[i+1].sy, points[i].color);
                }
            }
        }

        animate();
        requestAnimFrame(render);
    }
    function animate(time) {
        var time = new Date().getTime();
        var t = (time - last) / 1000;
        t = t > 0.2 ? 0.2 : t; // HACK - clamp time so it doesnt go haywire when last grows large cus render stops
        
        //based on : www.matthiasmueller.info/talks/GDC2008.pdf
        var pt, newpts = points.slice(0,numpts);
        for(var i = numpts; i < points.length-numpts;i++) {
            pt = sCopy(points[i]);
            f = Math.pow(wavespeed,2) * 
                (points[i-1     ].y + points[i+1     ].y + 
                 points[i-numpts].y + points[i+numpts].y - 
                 4*points[i].y)/Math.pow(h,2);
                
            pt.vy = (points[i].vy + f*t)*damp;
            pt.y  = points[i].y  + pt.vy*t;
            
            pt.color = "hsl("+((Math.abs(pt.y)/(impulse*colordepth))*360 + color).toFixed(0)+",100%,50%)";
            newpts.push( pt );
        }
        points = newpts.concat(points.slice(-numpts));
        
        last = time;
    }
    function sCopy(obj) {
        var o = {};
        for(var a in obj) {
            if(obj.hasOwnProperty(a)){ o[a] = obj[a]; }
        }
        return o;
    }
    function drawCircle(x, y, r, w, color) {
        ctx.fillStyle = color;
        ctx.lineWidth = w;
        ctx.beginPath(); 
        ctx.arc(x, y, (r>0?r:0), 0, Math.PI*2);
        ctx.fill();
	   }
    function drawBox(x, y, r, w, color) {
        ctx.fillStyle = color;
        ctx.beginPath(); 
        ctx.rect(x, y, (r>0?r:0), (r>0?r:0));
        ctx.fill();
	   }
    function drawLine(sx,sy, x, y, color) {
		     ctx.strokeStyle = color;
		     ctx.beginPath(); 
       ctx.moveTo(sx,sy); 
       ctx.lineTo(x, y);
		     ctx.stroke();
	   }
    function rain() {
        var pt = Math.floor(Math.random()*numpts*numpts);
        points[pt].vy += impulse*Math.random()*7;
        
        if(raining){
            setTimeout(rain, Math.random()*1000);
        }
    }
    
    function transform(pt) {
        return project(rotate(pt));
    }
    function rotate(pt) {
        pt.rx = (pt.x)*Math.cos(ry)-(pt.z)*Math.sin(ry);
        pt.rz = (pt.x)*Math.sin(ry)+(pt.z)*Math.cos(ry);
        
        pt.ry = (pt.y)*Math.cos(-rx)-(pt.rz)*Math.sin(-rx);
        pt.rz = (pt.y)*Math.sin(-rx)+(pt.rz)*Math.cos(-rx) + z;
        
        return pt;
    }
    function project(pt) {
        pt.sx = ctx.canvas.width/2  +  (pt.rx * (dist/pt.rz));
        pt.sy = ctx.canvas.height/2 +  (pt.ry * (dist/pt.rz));
        pt.sscale = (dist/pt.rz);
	   }
    function init() {
        points = [];
        for(var i = 0; i < numpts;i++){ 
            for(var j = 0; j < numpts;j++){ 
                points.push( new Point( i*space - (numpts/2), 0, j*space - (numpts/2), pscale) ); 
            }
        }
    }
    
    window.addEventListener('load', onLoad, false);
    function onLoad(evt) {
        
        var canvas = document.querySelector('canvas');
        ctx = canvas.getContext("2d");
        window.onresize = function () {
		          ctx.canvas.height = document.body.offsetHeight;
		          ctx.canvas.width = document.body.offsetWidth;
            init();
		      };
        window.onresize();
      
        canvas.addEventListener('mousedown', function(evt) { 
            mouse = true; 
            lastx=((evt.layerX||evt.offsetX||evt.clientX) - ctx.canvas.width/2)/ctx.canvas.width * Math.PI*2;
            lasty=((-evt.layerY||evt.offsetY||evt.clientY) - ctx.canvas.height/2)/ctx.canvas.height * Math.PI*2;
        });
        canvas.addEventListener('mouseup', function(evt) { 
            mouse = false;
        });
        canvas.addEventListener('mousemove', function(evt) {
             
            if(!mouse){
                
                var ex = ( evt.layerX||evt.offsetX||evt.clientX);
                var ey = Math.abs( (-evt.layerY||evt.offsetY||evt.clientY) );
            
                for(var i = 0; i < points.length;i++) {
                    var pt = points[i];
                    if(ex < pt.sx + 10  && ex > pt.sx - 10 
                    && ey < pt.sy + 10  && ey > pt.sy - 10 
                    ){
                        points[i].vy = impulse;
                        points[i].t = 0;
                    }
                }
                return;
            }
            
            var ex = ( evt.layerX||evt.offsetX||evt.clientX);
            var ey = (-evt.layerY||evt.offsetY||evt.clientY);
            
            var r = ((ex - ctx.canvas.width/2)/ctx.canvas.width) * Math.PI*2;
            ry += r - lastx;
            lastx = r;
            
            var r2 = ((ey - ctx.canvas.height/2)/ctx.canvas.height) * Math.PI*2;
            rx += r2 - lasty;
            lasty = r2;
        });
        function mousewheel(evt) {
            z += evt.wheelDelta/Math.abs(evt.wheelDelta) * -10;
            if(z > 1000) {z = 1000; }
            if(z < 30) {z = 30; }
        }
        canvas.addEventListener('mousewheel', mousewheel);
        canvas.addEventListener('DOMMouseScroll', mousewheel);
        
        rain();
        render();
    }
    
var gui = new dat.GUI();
gui.close();
var np = gui.add(window, "numpts",10, 50).step(1.0).onChange(function(){ init(); });
gui.add(window, "pscale",0.1, 1.5).onChange(function(){ init(); });
gui.add(window, "rtype", ['box','circle','line'] );
gui.add(window, "color", 0, 360);
gui.add(window, "colordepth", 1, 10);
gui.add(window, "impulse", 1, 10);
gui.add(window, "damp", 0.1, 0.99);
gui.add(window, "wavespeed", 20, 100);
gui.add(window, "raining").onChange(function(val) { if(val) rain(); });

window.requestAnimFrame = (function(){
  return window.requestAnimationFrame       ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         function( callback ){
            window.setTimeout(callback, 1000 / 60);
         };
})();