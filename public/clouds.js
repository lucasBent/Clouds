import { Entity, Entities, SolidColor, Sprite, Sound, Input, Hitbox, Renderer, Loader, Main, Global } from "./engine/engine.js"
import "./hammer.min.js"

const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");
const touch = new Hammer.Manager(canvas, {
    recognizers: [
        [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL }]
    ]
});
touch.on("swipe", (ev) => {
    if ("ontouchstart" in window) {
        if (ev.direction == 8)
            genCloud();
        else if (ev.direction == 16) {
            for (let entity of Entities.list) {
                if (entity instanceof Cloud)
                    entity.erasing = true;
            }
        }
        else if (ev.direction == 2 || ev.direction == 4) {
            if (!makingRainbow && !fadingRainbow) {
                Global.raining = !Global.raining;
                lightning.timer = random(4000, 8000);
            }
        }
    }
});
Global.assets.img = new Object();
Global.assets.audio = new Object();
Global.debug = false;
Global.paused = false;
Global.raining = false;
let jimmy = "cool guy";
let sky = undefined;
let lightning = undefined;
let rainbow = undefined;
let rainbowSlide = undefined;
let nextFrame = false;
let lightningStruck = false;
let makingRainbow = false;
let fadingRainbow = false;

async function load() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // #58a7d6?
    ctx.fillStyle = "#478db5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let skyImage = new SolidColor("#478db5", canvas.width, canvas.height);
    sky = new Entity(new Sprite([skyImage]), canvas.width / 2, canvas.height / 2);
    sky.process = () => {
        sky.sprite.frames[sky.sprite.currentFrame].width = Renderer.getCanvasWidth();
        sky.sprite.frames[sky.sprite.currentFrame].height = Renderer.getCanvasHeight();
        sky.x = Renderer.getCanvasWidth() / 2;
        sky.y = Renderer.getCanvasHeight() / 2;
        if (Global.raining) {
            if (!Global.rain.isPlaying())
                Global.rain.play();
            if (sky.brightness > 50) {
                sky.brightness -= 0.05 * Main.delta;
                if (sky.brightness < 50) {
                    sky.brightness = 50;
                    startRaining();
                }
                Global.music.audio.volume = sky.brightness / 100;
                Global.rain.audio.volume = 1 - sky.brightness / 100;
            }
        }
        else {
            if (sky.brightness < 100) {
                sky.brightness += 0.025 * Main.delta;
                if (sky.brightness > 75)
                    stopRaining();
                if (sky.brightness > 100) {
                    sky.brightness = 100;
                    Global.rain.stop();
                    if (lightningStruck) {
                        lightningStruck = false;
                        makeRainbow();
                    }
                }
                Global.music.audio.volume = sky.brightness / 100;
                Global.rain.audio.volume = 1 - sky.brightness / 100;
            }
        }
    }

    let lightningImage = new SolidColor("#eeeeee", canvas.width, canvas.height);
    lightning = new Entity(new Sprite([lightningImage]), canvas.width / 2, canvas.height / 2);
    lightning.render = false;
    lightning.timer = random(4000, 8000);
    lightning.flashing = false;
    lightning.process = () => {
        lightning.sprite.frames[lightning.sprite.currentFrame].width = Renderer.getCanvasWidth();
        lightning.sprite.frames[lightning.sprite.currentFrame].height = Renderer.getCanvasHeight();
        lightning.x = Renderer.getCanvasWidth() / 2;
        lightning.y = Renderer.getCanvasHeight() / 2;
        if (Global.raining && !lightning.flashing) {
            lightning.timer -= Main.delta;
            if (lightning.timer < 0)
                lightning.timer = 0;
            if (lightning.timer == 0) {
                lightningStruck = true;
                lightning.render = true;
                lightning.opacity = 0.8;
                lightning.flashing = true;
                Global.thunder[random(0, 3)].playNow(0);
            }
        }
        if (lightning.flashing) {
            lightning.opacity -= lightning.opacity * Main.delta / 200;
            if (lightning.opacity < 0.0025)
                lightning.opacity = 0;
            if (lightning.opacity == 0) {
                lightning.render = false;
                lightning.flashing = false;
                lightning.timer = random(1000, 28000);
            }
        }
    }

    let rainbowImage = await Loader.loadImage("./images/rainbow.png", canvas.width);
    rainbowImage.height = rainbowImage.width * 0.259282178 / (canvas.width / canvas.height);
    rainbow = new Entity(new Sprite([rainbowImage]), canvas.width / 2, canvas.height / 2.5);
    rainbow.render = true;
    rainbow.opacity = 1;
    rainbow.process = () => {
        rainbow.x = canvas.width / 2;
        rainbow.y = canvas.height / 2.5;
        rainbowImage.width = Renderer.getCanvasWidth();
        rainbowImage.height = rainbowImage.width * 0.259282178 / (canvas.width / canvas.height);
        if (fadingRainbow) {
            rainbow.opacity -= Main.delta / 30000;
            if (rainbow.opacity <= 0) {
                rainbow.render = false;
                rainbow.opacity = 1;
                fadingRainbow = false;
            }
        }
    }

    let rainbowSlideImage = new SolidColor("#478db5", rainbowImage.width, rainbowImage.height);
    rainbowSlide = new Entity(new Sprite([rainbowSlideImage]), canvas.width / 2, canvas.height / 2.5);
    rainbowSlide.render = false;
    rainbowSlide.progress = 1;
    rainbowSlide.timer = 2000;
    rainbowSlide.process = () => {
        if (!makingRainbow)
            rainbowSlide.x = rainbow.x;
        rainbowSlide.y = rainbow.y;
        rainbowSlideImage.width = rainbowImage.width;
        rainbowSlideImage.height = rainbowImage.height;
        if (makingRainbow) {
            if (rainbowSlide.timer > 0)
                rainbowSlide.timer -= Main.delta;
            if (rainbowSlide.timer < 0)
                rainbowSlide.timer = 0;
            if (rainbowSlide.timer == 0) {
                rainbowSlide.progress += Main.delta;
                if (rainbowSlide.progress >= 2000) {
                    makingRainbow = false;
                    rainbowSlide.progress = 1;
                    rainbowSlide.timer = 2000;
                    rainbowSlide.render = false;
                    fadingRainbow = true;
                }
                else
                    rainbowSlide.x = rainbow.x + canvas.width * (rainbowSlide.progress / 2000);
            }
        }
    }

    Main.init(canvas);

    Input.mouseHook();
    Input.keyHook();

    Global.assets.img.cloudImg = await Loader.loadImage("./images/cloud.png", 28, 31);
    Global.assets.img.raindropImg = await Loader.loadImage("./images/raindrop.png", 3, 30);
    Global.assets.audio.music = await Loader.loadAudio("./audio/undella town.mp3");
    Global.assets.audio.thunder1 = await Loader.loadAudio("./audio/thunder1.mp3");
    Global.assets.audio.thunder2 = await Loader.loadAudio("./audio/thunder2.mp3");
    Global.assets.audio.thunder3 = await Loader.loadAudio("./audio/thunder3.mp3");
    Global.assets.audio.thunder4 = await Loader.loadAudio("./audio/thunder4.mp3");
    Global.assets.audio.rain = await Loader.loadAudio("./audio/rain.mp3");
    Global.music = new Sound(Global.assets.audio.music);
    Global.thunder = [new Sound(Global.assets.audio.thunder1), new Sound(Global.assets.audio.thunder2), new Sound(Global.assets.audio.thunder3), new Sound(Global.assets.audio.thunder4)];
    Global.rain = new Sound(Global.assets.audio.rain);

    if (Global.debug) {
        jimmy = new Cloud(400, 500);
        jimmy.process = () => {
            jimmy.mouseDown = Input.detect("mousedown").on(jimmy);
            jimmy.mouseOver = Input.detect("mouseover").on(jimmy);
            if (!jimmy.mouseDown)
                jimmy.direction += 1.5 * jimmy.clockwise * Main.delta;
        }
        // cloudFormation(300, 100, 120, 80, 100);
        // cloudFormation(1000, 400, 170, 100, 180);
    }
    //for (let i = 0; i < random(5, 10); i++)
    //    genCloud();
}

(async function main() {
    await load();
    Main.processBefore = () => {
        if (Input.detect("click").on("anywhere"))
            cloudFormation2(Input.mouseX, Input.mouseY);
        if (Input.detect("keyjustpressed").on("ArrowDown")) {
            for (let entity of Entities.list) {
                if (entity instanceof Cloud)
                    entity.erasing = true;
            }
        }
        if (Input.detect("keyjustpressed").on("ArrowUp"))
            genCloud();
        if (Input.detect("keyjustpressed").on(" ")) {
            if (!makingRainbow && !fadingRainbow) {
                Global.raining = !Global.raining;
                lightning.timer = random(4000, 8000);
            }
        }
    }
    Main.processAlwaysAfter = () => {
        if (!Global.music.isPlaying())
            Global.music.play();
        if (Input.detect("keyjustpressed").on("Enter"))
            Global.paused = !Global.paused;
        if (Global.debug) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "16px arial";
            ctx.fillText(`mouseX: ${Input.mouseX}`, 20, 30);
            ctx.fillText(`mouseY: ${Input.mouseY}`, 20, 50);
            ctx.fillText(`mouseDown: ${Input.mouseDown}`, 20, 70);
            ctx.fillText(`mouse over jimmy?: ${jimmy.mouseOver}`, 20, 90);
            ctx.fillText(`mouse down on jimmy?: ${jimmy.mouseDown}`, 20, 110);
            ctx.fillText(`fps: ${Main.fps}`, 20, 130);
            ctx.fillText(`rightMouseDown: ${Input.rightMouseDown}`, 20, 150);
            ctx.fillText(`paused: ${Global.paused}`, 20, 170);
            ctx.fillText(`dpi: ${window.devicePixelRatio}`, 20, 190);

            if (nextFrame) {
                if (Global.paused)
                    Global.paused = false;
                else {
                    Global.paused = true;
                    nextFrame = false;
                }
            }

            if (Global.paused && Input.detect("keyjustpressed").on("."))
                nextFrame = true;

            if (Input.detect("keyjustpressed").on("1"))
                console.log(Entities.list.length);

            if (Input.detect("keyjustpressed").on("2"))
                Global.thunder[random(0, 3)].playNow(0);
        }
    }
    Main.startProcess();
})();

class Cloud extends Entity {
    constructor(x, y, direction, timer) {
        x ??= 0;
        y ??= 0;
        direction ??= 0;
        timer ??= 0;
        super(new Sprite([Global.assets.img.cloudImg]), x, y, false, direction, 0.85);
        this.clockwise = Math.random() < 0.5 ? 1 : -1;
        this.scale = random(10, 60) / 100;
        this.opacity = this.scale * 0.85;
        this.timer = timer;
        this.erasing = false;

        this.process = () => {
            if (this.timer > 0) {
                this.opacity = 0;
                this.timer -= Math.round(Main.delta);
                return;
            }
            if (!this.erasing) {
                if (this.scale < 0.99) {
                    this.scale += 0.05 * (1 - this.scale) * Main.delta / 6.9;
                    this.opacity = this.scale * 0.85;
                }
                else {
                    this.scale = 1;
                    if (Input.detect("rightmousedown").on(this))
                        this.erasing = true;
                }
            }
            else {
                if (this.scale > 0.1) {
                    this.scale -= 0.05 * this.scale * Main.delta / 6.9;
                    if (this.scale < 0)
                        this.scale = 0;
                    this.opacity = this.scale * 0.85;
                }
                else {
                    this.delete();
                }
            }
            this.direction += 1.8 * this.clockwise * Main.delta;
        }
    }
}

class Raindrop extends Entity {
    constructor(x, y, parent) {
        x ??= 0;
        y ??= 0;
        super(new Sprite([Global.assets.img.raindropImg]), x, y, 4);
        this.yVel = 0.5;
        this.timer = random(0, 1000);
        this.render = false;
        this.erasing = false;
        this.toErase = false;

        this.process = () => {
            if (!Global.raining)
                this.toErase = true;
            if (parent.deleted || parent.erasing || (Global.raining && this.toErase))
                this.erasing = true;
            if (this.timer > 0) {
                if (this.erasing) {
                    this.render = false;
                    this.delete();
                    return;
                }
                this.timer -= Main.delta;
                if (this.timer < 0)
                    this.timer = 0;
            }
            if (this.timer == 0) {
                this.render = true;
                this.yVel += 0.1 * Main.delta / 6.9;
                this.y += this.yVel * Main.delta;
                if (this.y > Renderer.getCanvasHeight() + 15) {
                    if (!this.erasing) {
                        this.render = false;
                        this.y = y;
                        this.timer = random(0, 1000);
                        this.yVel = 0.5;
                    }
                    else {
                        this.render = false;
                        this.delete();
                    }
                }
            }
        }
    }
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function cloudFormation(x, y, width, height, density) {
    for (let i = 0; i < density; i++)
        new Cloud(random(x - width / 2, x + width / 2), random(y - height / 2, y) + random(0, height / 2), i);
}

function cloudFormation2(x, y) {
    let density = random(5, 40);
    for (let i = 0; i < density; i++) {
        new Cloud(x, y, i, i * 10);
        x += random(Math.round(-20 + (i * 0.6)), 20 - (i * 0.6));
        y += random(-10 + (i * 0.1), 10 - (i * 0.1));
    }
}

function cloudFormation3(x, y) {
    let density = random(5, 20);
    for (let i = 0; i < density; i++) {
        new Cloud(x, y, i, i * 10);
        x += Math.floor(random(Math.round(-15 + (i * 0.9)), 15 - (i * 0.9)));
        y += Math.floor(random(-10 + (i * 0.5), 10 - (i * 0.5)));
    }
}

function genCloud() {
    let x = Renderer.getCanvasWidth() / 2 + random(Renderer.getCanvasWidth() / -4, Renderer.getCanvasWidth() / 4) + random(Renderer.getCanvasWidth() / -6, Renderer.getCanvasWidth() / 6);
    let y = Renderer.getCanvasHeight() / 2 + random(Renderer.getCanvasHeight() / -4, Renderer.getCanvasHeight() / 4) + random(Renderer.getCanvasHeight() / -6, Renderer.getCanvasHeight() / 6);
    for (let i = 0; i < random(10, 20); i++)
        cloudFormation3(x + random(-15, 15), y + random(-15, 15));
}

function startRaining() {
    for (let entity of Entities.list) {
        if (entity instanceof Cloud && Math.random() < 0.2)
            new Raindrop(entity.x, entity.y, entity);
    }
}

function stopRaining() {
    for (let entity of Entities.list) {
        if (entity instanceof Raindrop)
            entity.erasing = true;
    }
}

function makeRainbow() {
    rainbow.render = true;
    rainbow.opacity = 1;
    rainbowSlide.render = true;
    rainbowSlide.progress = 1;
    rainbowSlide.timer = 2000;
    makingRainbow = true;
    fadingRainbow = false;
}