/**
* A 2D entity that contains all components needed for basic use and display.
*/
export class Entity {

    /**
     * @param {Sprite} sprite The Sprite to use for this Entity.
     * @param {number} [x] The x position of this Entity.
     * @param {number} [y] The y position of this Entity.
     * @param {number} [direction] The direction of this Entity, in degrees.
     * @param {number} [opacity] The opacity of this Entity between 0 and 1, with 0 being invisible.
     * @param {Array} [hitboxes] An array of Hitboxes for this Entity. Will default to match the Entity's Sprite's initial frame.
     * @param {boolean} [collision] Determines whether other Entities can collide with this Entity.
     */
    constructor(sprite, x, y, direction, opacity, hitboxes, collision) {
        x ??= 0;
        y ??= 0;
        direction ??= 0;
        opacity ??= 1;
        hitboxes ??= [new Hitbox(sprite.frames[sprite.currentFrame].width, sprite.frames[sprite.currentFrame].height)];
        collision ??= false;
        this.sprite = sprite;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.opacity = opacity;
        this.hitboxes = [];
        this.addHitboxes(hitboxes);
        this.collision = collision;
        this.scale = 1;
        this.deleted = false;
        this.brightness = 100;
        this.init();
    }

    /**
     * Adds the specified hitboxes to this Entity.
     * @param {Array} hitboxes The hitboxes to add to this Entity.
     */
    addHitboxes(hitboxes) {
        for (let hitbox of hitboxes) {
            hitbox.parent = this;
            this.hitboxes.push(hitbox);
        }
    }

    /**
     * Marks this Entity for addition to the main Entity list at the end of the current frame, effectively initializing it.
     */
    init() {
        Entities.addQueue.push(this);
    }

    /**
     * Marks this Entity for deletion at the end of the current frame.
     */
    delete() {
        this.deleted = true;
        Entities.removeQueue.push(this);
    }
}

/**
* A class with static methods for keeping track of all Entities.
*/
export class Entities {

    static list = [];
    static addQueue = [];
    static removeQueue = [];

    /**
     * Add an Entity to the global list of Entities.
     * @param {Entity} entity The Entity to add.
     */
    static add(entity) {
        this.list.push(entity);
    }

    /**
     * Remove an Entity from the global list of Entities.
     * @param {Entity} entity The Entity to remove.
     */
    static remove(entity) {
        this.list.splice(this.list.indexOf(entity), 1);
    }
}

/**
* A solid color for use in a Sprite.
*/
export class SolidColor {

    /**
     * @param {string} color The hex code for this color.
     * @param {number} width The width of this solid color image.
     * @param {number} height The height of this solid color image.
     */
    constructor(color, width, height) {
        this.color = color;
        this.width = width;
        this.height = height;
    }
}

/**
* A 2D sprite.
*/
export class Sprite {

    /**
     * @param frames An array of Images/SolidColors for this Sprite.
     */
    constructor(frames) {
        this.frames = frames;
        this.currentFrame = 0;
    }
}

/**
* A class with static methods for input event listening.
*/
export class Input {

    /**
     * Initializes Input's reference to the canvas, as well as other needed variables.
     * @param {HTMLElement} canvas The canvas to listen to for input.
     */
    static init(canvas) {
        this.currentInput;
        this.mouseX;
        this.mouseY;
        this.click;
        this.mouseDown;
        this.rightMouseDown;
        this.canvas = canvas;
        this.keysDown = new Set();
        this.newKeys = new Set();
    }

    /**
    * Hooks mouse events to the canvas. Required in order to process mouse inputs.
    */
    static mouseHook() {
        this.canvas.onmousemove = (event) => {
            this.mouseX = event.offsetX;
            this.mouseY = event.offsetY;
        }

        this.canvas.onmouseup = (event) => {
            if (event.button == 0)
                this.mouseDown = false;
            else if (event.button == 2)
                this.rightMouseDown = false;
        }

        this.canvas.onmousedown = (event) => {
            if (event.button == 0)
                this.mouseDown = true;
            else if (event.button == 2)
                this.rightMouseDown = true;
        }

        this.canvas.onclick = (event) => {
            if (event.button == 0)
                this.click = true;
        }

        this.canvas.oncontextmenu = (event) => {
            event.preventDefault();
        }
    }

    /**
    * Hooks keyboard events to the canvas. Required in order to process keyboard inputs.
    */
    static keyHook() {
        this.canvas.tabIndex = 1000;
        this.canvas.focus();
        this.canvas.onkeydown = (event) => {
            if (!this.keysDown.has(event.key))
                this.newKeys.add(event.key);
            this.keysDown.add(event.key);
        }

        this.canvas.onkeyup = (event) => {
            this.keysDown.delete(event.key);
        }
    }


    /**
    * Resets the state of Input logic for the next frame of the main process.
    */
    static reset() {
        this.click = false;
        this.newKeys.clear();
    }

    /**
     * Takes a specific type of input to test for.
     * @param {string} input The name of the input type.
     */
    static detect(input) {
        this.currentInput = input;
        return this;
    }

    /**
    * Checks whether the mouse is within the specified area.
    * Alternatively, checks whether a keyboard event applies to the specified key.
    * @param {Entity|Hitbox|string} area The area or key to check. For mouse events it may be an Entity (checking all of their Hitboxes), a singular Hitbox, or "anywhere".
    * For keyboard events it should be the name of a key (e.g. "a" or "Shift").
    *
    * @returns true or false, depending on whether an input occurred as described.
    */
    static on(area) {

        if (this.currentInput == "mousedown") {
            if (this.mouseDown) {
                if (area == "anywhere")
                    return true;
                else if (area instanceof Entity) {
                    for (let hitbox of area.hitboxes) {
                        if (hitbox.touchingPoint(this.mouseX, this.mouseY)) {
                            return true;
                        }
                    }
                    return false;
                }
                else if (area instanceof Hitbox) {
                    if (area.touchingPoint(this.mouseX, this.mouseY)) {
                        return true;
                    }
                    return false;
                }
                else
                    return false;
            }
            else
                return false;
        }

        else if (this.currentInput == "rightmousedown") {
            if (this.rightMouseDown) {
                if (area == "anywhere")
                    return true;
                else if (area instanceof Entity) {
                    for (let hitbox of area.hitboxes) {
                        if (hitbox.touchingPoint(this.mouseX, this.mouseY)) {
                            return true;
                        }
                    }
                    return false;
                }
                else if (area instanceof Hitbox) {
                    if (area.touchingPoint(this.mouseX, this.mouseY)) {
                        return true;
                    }
                    return false;
                }
                else
                    return false;
            }
            else
                return false;
        }

        else if (this.currentInput == "mouseover") {
            if (area == "anywhere")
                return true;
            else if (area instanceof Entity) {
                for (let hitbox of area.hitboxes) {
                    if (hitbox.touchingPoint(this.mouseX, this.mouseY)) {
                        return true;
                    }
                }
                return false;
            }
            else if (area instanceof Hitbox) {
                if (area.touchingPoint(this.mouseX, this.mouseY)) {
                    return true;
                }
                return false;
            }
            else
                return false;
        }

        else if (this.currentInput == "click") {
            if (this.click) {
                if (area == "anywhere")
                    return true;
                else if (area instanceof Entity) {
                    for (let hitbox of area.hitboxes) {
                        if (hitbox.touchingPoint(this.mouseX, this.mouseY)) {
                            return true;
                        }
                    }
                    return false;
                }
                else if (area instanceof Hitbox) {
                    if (area.touchingPoint(this.mouseX, this.mouseY)) {
                        return true;
                    }
                    return false;
                }
                else
                    return false;
            }
            else
                return false;
        }

        else if (this.currentInput == "keydown") {
            return this.keysDown.has(area);
        }

        else if (this.currentInput == "keyjustpressed") {
            return this.newKeys.has(area);
        }

        else if (this.currentInput == "keyup") {
            return !this.keysDown.has(area);
        }

        else {
            console.error("Unrecognized input type!");
        }
    }
}

/**
* A Hitbox to be specified for an Entity.
* Each Hitbox must reference a parent Entity in order to function properly.
*/
export class Hitbox {

    /**
     * @param {number} width The width of the Hitbox.
     * @param {number} height The height of the Hitbox.
     * @param {number} [offsetX] The horizontal offset of the Hitbox from its parent Entity.
     * @param {number} [offsetY] The vertical offset of the Hitbox from its parent Entity.
     */
    constructor(width, height, offsetX, offsetY) {
        offsetX ??= 0;
        offsetY ??= 0;
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    /**
    * Checks whether a specific point is contained within the bounds of the Hitbox.
    * @param {number} x The x coordinate to check.
    * @param {number} y The y coordinate to check.
    *
    * @returns true if the point is in contact with the Hitbox, false if not
    */
    touchingPoint(x, y) {
        if (x > this.parent.x - this.width * this.parent.scale / 2 + this.offsetX * this.parent.scale / 2
            && x < this.parent.x + this.width * this.parent.scale / 2 + this.offsetX * this.parent.scale / 2
            && y > this.parent.y - this.height * this.parent.scale / 2 + this.offsetY * this.parent.scale / 2
            && y < this.parent.y + this.height * this.parent.scale / 2 + this.offsetY * this.parent.scale / 2) {
            return true;
        }
        return false;
    }
}

/**
* A class with static methods for rendering.
*/
export class Renderer {

    /**
     * Initializes Renderer's reference to the canvas, as well as other needed variables.
     * @param {HTMLElement} canvas The canvas to render on.
     */
    static init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
    }

    /**
     * Sets canvas brightness based on the corresponding value from a specific Entity.
     * @param {Entity} entity The Entity whose brightness should be matched.
     */
    static brightness(entity) {
        this.ctx.filter = "brightness(" + entity.brightness + "%)";
    }

    /**
     * Draws an Entity to the screen using its current frame.
     * @param {Entity} entity The Entity to render.
     */
    static renderEntity(entity) {
        let frame = entity.sprite.frames[entity.sprite.currentFrame];
        this.ctx.save();
        if (entity.brightness != 100)
            this.brightness(entity);
        this.ctx.translate(entity.x, entity.y);
        this.ctx.rotate(entity.direction * 0.0026 / Math.PI);
        this.ctx.globalAlpha = entity.opacity;
        this.ctx.translate(-(entity.x), -(entity.y));
        if (frame instanceof Image)
            this.ctx.drawImage(frame, entity.x - frame.width * entity.scale / 2, entity.y - frame.height * entity.scale / 2, frame.width * entity.scale, frame.height * entity.scale);
        else {
            this.ctx.fillStyle = frame.color;
            this.ctx.fillRect(entity.x - frame.width * entity.scale / 2, entity.y - frame.height * entity.scale / 2, frame.width * entity.scale, frame.height * entity.scale);
        }
        this.ctx.restore();
    }

    /**
     * Clears the screen.
     */
    static clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

/**
* A class with static async methods for loading.
*/
export class Loader {

    /**
     * Loads an Image object based on the given parameters.
     * @param {String} src The src of the image to be loaded.
     * @param {number} [width] The width of the image to be loaded.
     * @param {number} [height] The height of the image to be loaded.
     * 
     * @returns {Image} A loaded Image object.
     */
    static async loadImage(src, width, height) {
        let img = await this.loadImageProcess(src);
        if (width)
            img.width = width;
        if (height)
            img.height = height;
        return img;
    }

    static loadImageProcess(src) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        })
    }
}

/**
* A class with static methods relating to runtime.
*/
export class Main {

    /**
     * Initializes Main's reference to the canvas, as well as other needed variables.
     * Initializes Renderer and Input as well.
     * @param {HTMLElement} canvas The canvas to use.
     */
    static init(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        Renderer.init(canvas);
        Input.init(canvas);
        this.prevTimestamp;
        this.fps = 0;
        this.delta = 0;
    }

    static processBefore = undefined;
    static processAfter = undefined;
    static processAlwaysBefore = undefined;
    static processAlwaysAfter = undefined;

    /**
     * Matches the canvas size and DPI to that of the viewport.
     */
    static canvasResize() {
        Main.canvas.width = window.innerWidth;
        Main.canvas.height = window.innerHeight;
        let styleWidth = +getComputedStyle(Main.canvas).getPropertyValue("width").slice(0, -2);
        let styleHeight = +getComputedStyle(Main.canvas).getPropertyValue("height").slice(0, -2);
        Main.canvas.setAttribute("width", styleWidth * window.devicePixelRatio);
        Main.canvas.setAttribute("height", styleHeight * window.devicePixelRatio);
    }

    /**
     * Starts the main process.
     */
    static startProcess() {
        window.requestAnimationFrame(this.process);
    }

    /**
     * The main process, a procedure that repeats as fast as allowed by the user's refresh rate.
     */
    static process(timestamp) {

        if (Main.prevTimestamp) {
            // The delta between this frame and the previous one (in ms).
            Main.delta = timestamp - Main.prevTimestamp;
            // The FPS as calculated via the delta.
            Main.fps = Math.round(1000 / Main.delta);
        }
        else {
            Main.prevTimestamp = timestamp;
            window.requestAnimationFrame(Main.process);
            return;
        }

        Main.prevTimestamp = timestamp;

        // Match the canvas size and DPI to that of the viewport.
        Main.canvasResize();

        // Clear the screen.
        Renderer.clear();

        // Run process code from outside the engine that should always run, regardless of whether other processes are paused.
        if (Main.processAlwaysBefore)
            Main.processAlwaysBefore();

        // Run process code from outside the engine that does not apply to a specific Entity. Runs before built-in process code.
        if (Main.processBefore && !Global.paused)
            Main.processBefore();

        // Render and run the processes of all applicable Entities. Skip over Entities marked for deletion.
        for (let entity of Entities.list) {
            if (entity.deleted)
                continue;
            if (entity.process && !Global.paused)
                entity.process();
            Renderer.renderEntity(entity);
        }

        // Add all Entities in the queue for addition.
        while (Entities.addQueue.length > 0) {
            Entities.add(Entities.addQueue.shift());
        }

        // Remove all Entities in the queue for removal.
        while (Entities.removeQueue.length > 0) {
            Entities.remove(Entities.removeQueue.shift());
        }

        // Run process code from outside the engine that does not apply to a specific Entity. Runs after built-in process code.
        if (Main.processAfter && !Global.paused)
            Main.processAfter();

        // Run process code from outside the engine that should always run, regardless of whether other processes are paused.
        if (Main.processAlwaysAfter)
            Main.processAlwaysAfter();

        // Reset the state of Input logic for the next frame.
        Input.reset();


        // Call process again.
        window.requestAnimationFrame(Main.process);
    }
}

/**
* A class to house globals.
*/
export class Global {
    static paused = false;
}