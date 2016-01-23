// main.js
// Dependencies: 
// Description: singleton object
// This object will be our main "controller" class and will contain references
// to most of the other objects in the game.

"use strict";

// if app exists use the existing copy
// else create a new object literal
var app = app || {};

/*
 .main is an object literal that is a property of the app global
 This object literal has its own properties and methods (functions)
 
 */
app.main = {
	//  properties
	paused: false,
	animationID: 0,
    WIDTH : 1080, 
    HEIGHT: 720,
    canvas: undefined,
    ctx: undefined,
   	lastTime: 0, // used by calculateDeltaTime() 
    debug: false,
	
	gameState : undefined,
	roundScore : 0,
	totalScore : 0,	
	
	bgImage : undefined,
	
	//Player object: the ship
	PLAYERSHIP: Object.seal({
		POS: undefined,
		VELOCITY: undefined,
		//pos and velocity will be overwriten with a vector in init()
		FRICTION: 0.1,
		ANGLE: 0,
		SIZE: 65,
		FIRING: false,
		LASTSHOT: 0,
		FIRINGRATE: 100,
		IMAGE: undefined,
		TRAIL: undefined,
		score: 0
	}),
	
	//holds the coordinates of the mouse
	mousex: 0,
	mousey: 0,
	
	//properties for bullets
	bullets: [],
	bulletSpeed: 10,
	bulletColor: 'yellow',
	bulletSize: 10,
	bulletImg: undefined,
	
	//properties for enemies
	enemies: [],
	lastEnemySpawn: 0,
	enemySpawnTimer: 1000,
	enemySS: undefined,
	
	GAME_STATE: { // another fake enumeration
		BEGIN : 0,
		DEFAULT : 1,
		ROUND_OVER : 2,
		END : 3
	},
	
	//bool to help with navigating menus
	restartSpaceHeld : false,
	
	//start screen image
	IMGstart : undefined,
	
	sound : undefined,
    
    // methods
	init : function() {
		console.log("app.main.init() called");
		// initialize properties
		this.canvas = document.querySelector('canvas');
		this.canvas.width = this.WIDTH;
		this.canvas.height = this.HEIGHT;
		this.ctx = this.canvas.getContext('2d');
		
		//get the background image
		this.bgImage = document.getElementById("IMGbackground");
		
		this.canvas.onmousedown = this.doMousedown.bind(this);
		this.canvas.onmouseup = this.doMouseup.bind(this);
		
		//get the coordinates of the mouse every time it moves on the canvas
		this.canvas.addEventListener('mousemove', function(e) {
			var mouse = getMouse(e);
			app.main.mousex = mouse.x;
			app.main.mousey = mouse.y;
		}, false);
		
		this.gameState = this.GAME_STATE.BEGIN;
		
		//set up the player
		this.setUpPlayer();
		
		//set the enemy sprite sheet
		this.enemySS = document.getElementById("IMGenemySS");
		
		//set the bullet image
		this.bulletImg = document.getElementById("IMGbulletPlayer");
		
		this.reset();
		
		this.bgAudio = document.querySelector("#bgAudio");
		this.bgAudio.volume=0.25;
		this.effectAudio = document.querySelector("#effectAudio");
		this.effectAudio.volume = 0.3;
		
		//set the start screen image
		this.IMGstart = document.querySelector("#IMGstart");
		
		//console.log(app);
		
		// start the game loop
		this.update();
	},
	
	setUpPlayer: function() {
		//set the initial position and velocity of the player
		this.PLAYERSHIP.POS = new Victor(this.WIDTH/2, this.HEIGHT/2);
		this.PLAYERSHIP.VELOCITY = new Victor(0,0);
		
		//set up the shot timer
		var d = new Date();
		this.PLAYERSHIP.LASTSHOT = d.getTime();
		
		//set the player's image
		this.PLAYERSHIP.IMAGE = document.getElementById("IMGplayerShip");
		
		//Set up a trail for the player using an emitter
		this.PLAYERSHIP.TRAIL = new this.Emitter();
		this.PLAYERSHIP.TRAIL.blue = 255;
		this.PLAYERSHIP.TRAIL.greed = 100;
		this.PLAYERSHIP.TRAIL.red = 100;
		
		this.PLAYERSHIP.TRAIL.minXspeed = this.PLAYERSHIP.TRAIL.minYspeed = 0;
		this.PLAYERSHIP.TRAIL.maxXspeed = this.PLAYERSHIP.TRAIL.maxYspeed = 0;
		this.PLAYERSHIP.TRAIL.lifetime = 250;
		this.PLAYERSHIP.TRAIL.expansionRate = 0.05;
		this.PLAYERSHIP.TRAIL.numParticles = 100;
		this.PLAYERSHIP.TRAIL.xRange = 1;
		this.PLAYERSHIP.TRAIL.yRange = 1;
		this.PLAYERSHIP.TRAIL.createParticles({x:0,y:0});
	},
	
	reset: function() {
	//reset player
		this.PLAYERSHIP.POS = new Victor(this.WIDTH/2, this.HEIGHT/2);
		this.PLAYERSHIP.VELOCITY = new Victor(0,0);
		
		//clear the bullet and enemy arrays
		this.bullets = [];
		this.enemies = [];
		
		//reset the player's score
		this.PLAYERSHIP.score = 0;
	},
	
	update: function(){
		// 1) LOOP
		// schedule a call to update()
	 	this.animationID = requestAnimationFrame(this.update.bind(this));
	 	
	 	// 2) PAUSED?
	 	// if so, bail out of loop
		if(this.paused){
			this.drawPauseScreen(this.ctx);
			return;
		}
	 	
	 	// 3) HOW MUCH TIME HAS GONE BY?
	 	var dt = this.calculateDeltaTime();
	 	
		// 5) DRAW	
		// i) draw background
		this.ctx.drawImage(this.bgImage, 0, 0, this.WIDTH, this.HEIGHT);
		
		if(this.gameState == this.GAME_STATE.DEFAULT) {
			//spawn enemies
			var d = new Date();
			var t = d.getTime();
			
			//check and see how long it's been since the last enemy spawned; spawn if time elapsed
			if(t > this.enemySpawnTimer + this.lastEnemySpawn)
			{
				this.lastEnemySpawn = t;
				this.spawnEnemy();
			} 
			
			//object updates
			this.updatePlayer();
			this.updateBullets();
			this.updateEnemies();
			
			this.checkForCollisions();
			
			//speed up enemy spawning
			this.enemySpawnTimer *= 0.9999;
		}
		
		//let the player fly around in the start screen
		if(this.gameState == this.GAME_STATE.BEGIN)
		{
			this.updatePlayer();
			this.updateBullets();
			
			//moves to the playing game state when the user pressed space
			if(myKeys.keydown[32]){
				this.reset();
				this.gameState = this.GAME_STATE.DEFAULT;
				this.sound.playBGAudio();
			}
		}
		
		//draw player
			this.drawPLAYER(this.ctx);
			this.drawBULLETS(this.ctx);
			this.drawENEMIES(this.ctx);
	
		// iii) draw HUD
		this.ctx.globalAlpha = 1.0;
		this.drawHUD(this.ctx);
		
		// iv) draw debug info
		if (this.debug){
			// draw dt in bottom right corner
			this.fillText(this.ctx, "dt: " + dt.toFixed(3), this.WIDTH - 150, this.HEIGHT - 10, "18pt courier", "white");
		}
		
		//check if the game's over
		if(this.gameState == this.GAME_STATE.ROUND_OVER){
			
			//the following makes it so that it only restarts the game once the spacebar is released
			if(myKeys.keydown[32]) this.restartSpaceHeld = true;
		
			if(!myKeys.keydown[32] && this.restartSpaceHeld){
				this.reset();
				this.restartSpaceHeld = false;
				this.gameState = this.GAME_STATE.BEGIN;
				this.sound.stopBGAudio();
			}
		}
		
	},
	
	stopBGAudio: function(){
		this.sound.stopBGAudio();
	},

	checkForCollisions: function(){
		//collisions between bullets and enemies
		for(var i = 0; i < this.enemies.length; i++){
			var enem = this.enemies[i];
			
			for(var j = 0; j < this.bullets.length; j++){
				var bul = this.bullets[j];
				
				var dx = enem.pos.x - bul.pos.x;
				var dy = enem.pos.y - bul.pos.y;
				var dist = Math.sqrt(dx*dx + dy*dy);
				
				if(dist < bul.size + enem.size/2){
					console.log("Bullet collision");
					this.bullets.splice(j, 1);
					this.enemies.splice(i, 1);
					
					this.sound.playEffect("Explosion.wav");
					this.PLAYERSHIP.score += 100;
				}				
			}
			
			//while in the enemy array, check for collision with player
			var dx1 = this.PLAYERSHIP.POS.x - enem.pos.x;
			var dy1 = this.PLAYERSHIP.POS.y - enem.pos.y;
			var dist = Math.sqrt(dx1*dx1 + dy1*dy1);
			
			//end the game if an enemy hits the player
			if(dist < (enem.size/2 + this.PLAYERSHIP.SIZE/2)) {
				this.gameState = this.GAME_STATE.ROUND_OVER;
			}
		}
	},
	
	fillText: function(ctx, string, x, y, css, color) {
		ctx.save();
		// https://developer.mozilla.org/en-US/docs/Web/CSS/font
		ctx.font = css;
		ctx.fillStyle = color;
		ctx.fillText(string, x, y);
		ctx.restore();
	},
	
	drawHUD: function(ctx){
		ctx.save();

		// NEW
		if(this.gameState == this.GAME_STATE.BEGIN){
			ctx.drawImage(this.IMGstart, 0, 0, this.WIDTH, this.HEIGHT);
			this.fillText(ctx, "Game by Timothy Bonin", 10, 30, "30px VT323", "white");
		} // end if
	
		if(this.gameState == this.GAME_STATE.DEFAULT) {
			this.fillText(ctx, "Score: " + this.PLAYERSHIP.score, 10, 30, "30px VT323", "white");
		}
	
		// NEW
		if(this.gameState == this.GAME_STATE.ROUND_OVER){
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			this.fillText(ctx, "Game Over!", this.WIDTH/2, this.HEIGHT/2 - 50, "100px VT323", "white");
			this.fillText(ctx, "Your Score: " + this.PLAYERSHIP.score, this.WIDTH/2, this.HEIGHT/2 + 10, "40px VT323", "white");
			this.fillText(ctx, "Press Space to return to the Start Screen" , this.WIDTH/2, this.HEIGHT/2 + 100, "40px VT323", '#7ad7f2');
		} // end if
		
		ctx.restore(); // NEW
	},
	
	drawPLAYER: function(ctx) {
		ctx.save();
		ctx.strokeStyle = '#00f';
		ctx.lineWidth = 3;
		
		//draw the player's trail
		this.PLAYERSHIP.TRAIL.updateAndDraw(this.ctx, {x:this.PLAYERSHIP.POS.x, y:this.PLAYERSHIP.POS.y});
		
		ctx.translate(this.PLAYERSHIP.POS.x, this.PLAYERSHIP.POS.y);
		ctx.rotate(this.PLAYERSHIP.ANGLE + Math.PI/2);
		
		//draw the players bounding circle and sprite
		ctx.beginPath();
		ctx.arc(0,0, this.PLAYERSHIP.SIZE/2 + 2, 0, Math.PI *2, false);
		ctx.stroke();
		ctx.drawImage(this.PLAYERSHIP.IMAGE, -this.PLAYERSHIP.SIZE/2, -this.PLAYERSHIP.SIZE/2, this.PLAYERSHIP.SIZE, this.PLAYERSHIP.SIZE);
		
		ctx.restore();
	},
		
	calculateDeltaTime: function(){
		// what's with (+ new Date) below?
		// + calls Date.valueOf(), which converts it from an object to a 	
		// primitive (number of milliseconds since January 1, 1970 local time)
		var now,fps;
		now = (+new Date); 
		fps = 1000 / (now - this.lastTime);
		fps = clamp(fps, 12, 60);
		this.lastTime = now; 
		return 1/fps;
	},
	
	updatePlayer: function() {
		//Player keyboard controls
		if(myKeys.keydown[87]){
			this.PLAYERSHIP.VELOCITY.y -= 0.5;
		}
		if(myKeys.keydown[83]){
			this.PLAYERSHIP.VELOCITY.y += 0.5;
		}
		
		if(myKeys.keydown[65]){
			this.PLAYERSHIP.VELOCITY.x -= 0.5;
		}
		if(myKeys.keydown[68]){
			this.PLAYERSHIP.VELOCITY.x += 0.5;
		}
		
		
		//player movement and physics
		this.PLAYERSHIP.POS.add(this.PLAYERSHIP.VELOCITY);
		
		var fricVec = new Victor(0,0);
		fricVec.subtract(this.PLAYERSHIP.VELOCITY);
		
		fricVec.x *= this.PLAYERSHIP.FRICTION;
		fricVec.y *= this.PLAYERSHIP.FRICTION;
		
		this.PLAYERSHIP.VELOCITY.add(fricVec);
		
		//zero the velocity if it's low enough
		if(Math.abs(this.PLAYERSHIP.VELOCITY.x) < 0.1)
		{
			this.PLAYERSHIP.VELOCITY.x = 0;
		}
		
		if(Math.abs(this.PLAYERSHIP.VELOCITY.y) < 0.1)
		{
			this.PLAYERSHIP.VELOCITY.y = 0;
		}
		
		//checking for the player going out of bounds and preventing it
		if(this.PLAYERSHIP.POS.x < (0 + this.PLAYERSHIP.SIZE))
		{
			this.PLAYERSHIP.POS.x = 0 + this.PLAYERSHIP.SIZE;
			this.PLAYERSHIP.VELOCITY.x = 0;
		}
		if(this.PLAYERSHIP.POS.x > (this.WIDTH - this.PLAYERSHIP.SIZE))
		{
			this.PLAYERSHIP.POS.x = this.WIDTH - this.PLAYERSHIP.SIZE;
			this.PLAYERSHIP.VELOCITY.x = 0;
		}
		if(this.PLAYERSHIP.POS.y < (0 + this.PLAYERSHIP.SIZE))
		{
			this.PLAYERSHIP.POS.y = 0 + this.PLAYERSHIP.SIZE;
			this.PLAYERSHIP.VELOCITY.y = 0;
		}
		if(this.PLAYERSHIP.POS.y > (this.HEIGHT - this.PLAYERSHIP.SIZE))
		{
			this.PLAYERSHIP.POS.y = this.HEIGHT - this.PLAYERSHIP.SIZE;
			this.PLAYERSHIP.VELOCITY.y = 0;
		}
		
		//check and see if the player is firing (mouse down)
		if(this.PLAYERSHIP.FIRING){ 
			var d = new Date();
			var t = d.getTime();
			
			//check the timer for the player's firing rate and fire if it's time
			if(t > this.PLAYERSHIP.FIRINGRATE + this.PLAYERSHIP.LASTSHOT)
			{
				this.PLAYERSHIP.LASTSHOT = t;
				this.makeBullet(this.PLAYERSHIP.POS.x, this.PLAYERSHIP.POS.y, this.mousex, this.mousey);
			} 
		}
		
		
		//change the player sprite angle according to where the mouse is
		var delX = this.mousex - this.PLAYERSHIP.POS.x;
		var delY = this.mousey - this.PLAYERSHIP.POS.y;
		
		var angRad = Math.atan2(delY, delX);
		this.PLAYERSHIP.ANGLE = angRad;
	},
	
	spawnEnemy: function(){
		//creates an enemy at a random spot on the outside of the screen
		var enem = {};

		enem.pos = new Victor(this.WIDTH/2 + 20,0);
		enem.pos.rotate(getRandom(0, Math.PI *2));
		enem.pos.add(new Victor(this.WIDTH/2, this.HEIGHT/2));
		enem.size = 40;
		enem.velocity = new Victor(0,0);
		enem.speed = 3;
		enem.angle = 0;
		enem.animFrame = 0;
		enem.spriteSheet = this.enemySS;
		enem.animSpeed = 6;
		
		Object.seal(enem);
		this.enemies.push(enem);
	},
	
	updateEnemies: function() {
		for(var i = 0; i < this.enemies.length; i++){
			var enem = this.enemies[i];
			
			//the enemies always head towards the player
			var playerX = this.PLAYERSHIP.POS.x;
			var playerY = this.PLAYERSHIP.POS.y;
			enem.velocity = new Victor((playerX - enem.pos.x), (playerY - enem.pos.y));
			enem.velocity.normalize();
			enem.velocity.x *= enem.speed;
			enem.velocity.y *= enem.speed;
			
			//updates the animation variables
			enem.animSpeed--;
			if(enem.animSpeed == 0){
				enem.animSpeed = 6;
				enem.animFrame++;
				if(enem.animFrame >= 10) enem.animFrame = 0;
			}
			
			//move the enemies
			enem.pos.add(enem.velocity);
		}
	},
	
	drawENEMIES: function(ctx){
		for(var i = 0; i < this.enemies.length; i++){
			var enem = this.enemies[i];
			
			ctx.save();
			
			ctx.fillStyle = 'red';
			
			//animation
			ctx.drawImage(enem.spriteSheet, 100 * enem.animFrame, 0, 100, 100, enem.pos.x - enem.size/2, enem.pos.y - enem.size/2, enem.size, enem.size);
			
			ctx.restore();
			
		}
	},
	
	makeBullet: function(x, y, dirx, diry){
		var b = {};
		
		//creates a bullet that travels towards the player's mouse
		
		b.pos = new Victor(0,0);
		b.pos.x = x;
		b.pos.y = y;
		
		b.size = this.bulletSize;
		b.color = this.bulletColor;
		b.speed = this.bulletSpeed;
		
		b.velocity = new Victor(0,0);
		b.velocity.x = dirx - x;
		b.velocity.y = diry - y;
		b.velocity.normalize();
		b.velocity.x *= b.speed;
		b.velocity.y *= b.speed;
		
		b.pos.add(b.velocity);
		
		b.img = this.bulletImg;
		
		Object.seal(b);
		this.bullets.push(b);
		
		//play a shooting sound effect
		this.sound.playEffect("Laser_Shoot.wav");
		
		//decrease the player's score
		if(this.PLAYERSHIP.score > 0)
		{
			this.PLAYERSHIP.score -= 10;
		}
	},
	
	updateBullets: function(){
		for(var i = 0; i < this.bullets.length; i++){
			var b = this.bullets[i];
			b.pos.add(b.velocity);
		}
	},
	
	drawBULLETS: function(ctx){		
		for(var i = 0; i < this.bullets.length; i++){
			var b = this.bullets[i];
		
			ctx.drawImage(b.img, b.pos.x - b.size/2, b.pos.y - b.size/2, b.size, b.size);
		}
	},
	
	doMousedown: function(e){	
		//this.sound.playBGAudio();
	
		//unpause on a click
		//just to make sure we never get stuck in a paused state
		if(this.paused){
			this.paused = false;
			this.update();
			return;
		};
		
		var mouse = getMouse(e);
		
		//console.log("(mouse.x, mouse.y)=" + mouse.x + "," + mouse.y);
		
		this.PLAYERSHIP.FIRING = true;
	},
	
	doMouseup: function(e){
		this.PLAYERSHIP.FIRING = false;
	},
	
	pauseGame: function() {
		this.paused = true;
		this.stopBGAudio();
		cancelAnimationFrame(this.animationID);
		this.update();
	},
	
	resumeGame: function(){
		cancelAnimationFrame(this.animationID);
		
		if(this.gameState != this.GAME_STATE.BEGIN) this.sound.playBGAudio();
		this.paused = false;
		
		this.update();
	},
	
	drawPauseScreen: function(ctx){
		ctx.save();
		ctx.fillStyle = "black";
		ctx.fillRect(0,0, this.WIDTH, this.HEIGHT);
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		this.fillText(this.ctx, "...PAUSED...", this.WIDTH/2, this.HEIGHT/2, "40pt courier", "white");
		ctx.restore();
	},
	
	toggleDebug: function(){
		if(this.debug === true)
		{
			this.debug = false;
		} else {
			this.debug = true;
		}
	}
    
}; // end app.main