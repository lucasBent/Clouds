import { Entity, Entities, Sprite, Input, Hitbox, Renderer, Loader, Main, Global } from "./engine/engine.js"

const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");
Global.assets = new Object();
Global.debug = true;
Global.paused = false;
let jimmy = "cool guy";
let nextFrame = false;

async function load() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "#478db5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Main.init(canvas);

    Input.mouseHook();
    Input.keyHook();

    Global.assets.cloudImg = await Loader.loadImage("./images/cloud.png", 28, 31);

    if (Global.debug) {
        jimmy = new Cloud(400, 500);
        jimmy.process = () => {
            jimmy.mouseDown = Input.detect("mousedown").on(jimmy);
            jimmy.mouseOver = Input.detect("mouseover").on(jimmy);
            if (!jimmy.mouseDown)
                jimmy.direction += 1.5 * jimmy.clockwise * Main.delta;
        }
        cloudFormation(300, 100, 120, 80, 100);
        cloudFormation(1000, 400, 170, 100, 180);
    }
}

(async function main() {
    await load();
    Main.processAlwaysBefore = () => {
        // #58a7d6?
        ctx.fillStyle = "#478db5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    Main.processBefore = () => {
        if (Input.detect("click").on("anywhere"))
            cloudFormation2(Input.mouseX, Input.mouseY);
    }
    Main.processAlwaysAfter = () => {
        if (Input.detect("keyjustpressed").on(" ")) {
            Global.paused = !Global.paused;
        }
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
        super(new Sprite([Global.assets.cloudImg]), x, y, direction, 0.85);
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
            if (this.scale < 0.99) {
                this.scale += 0.05 * (1 - this.scale) * Main.delta / 6.9;
                this.opacity = this.scale * 0.85;
            }
            else {
                this.scale = 1;
                if (Input.detect("rightmousedown").on(this))
                    this.erasing = true;
            }
            if (this.erasing) {
                if (this.scale > 0.2) {
                    this.scale -= 0.05 * Main.delta / 6.9;
                    if (this.scale < 0)
                        this.scale = 0;
                    this.opacity = this.scale * 0.85;
                }
                else
                    this.delete();
            }
            this.direction += 1.5 * this.clockwise * Main.delta;
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
        x += random(Math.round(-20 + (i * 0.5)), 20 - (i * 0.5));
        y += random(-10 + (i * 0.1), 10 - (i * 0.1));
    }
}