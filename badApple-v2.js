// Bad Apple!! Renderer V2 for bwplace
// (c) gamer0mega 2024-2025


// user defined config
const targetWidth = 100; // image width on canvas
const targetHeight = 90; // image height on canvas
const startAtX = 0; // x offset on canvas
const startAtY = 0; // y offset on canvas
const fillMethod = 2; // 1 - horizontal 2 - vertical
const skipFrames = 0; // the frame to start(continue) from
const skipUnchangedPixels = true; // whether to skip unchanged pixels
const apiUrl = "http://5.59.97.201:6969/updatePixel"; // api url
const socketUrl = "http://5.59.97.201:6969/"; // socket.io url, optional but if set will listen for pixel updates and fix them
const proxyUrl = "http://127.0.0.1:3128"; // tor ip rotator proxy url
const maxRetries = 5; // max pixel draw retries
const statsInterval = 180000; // stats log interval
const frameDir = "./frames/"; // frames directory
const delay = 10; // delay between requests
const reloadFramesAt = 100; // reload frames when less than x frames in ram
const framesToLoad = 1000; // how many frames to load at once (affects ram usage, recommended not to set it to values higher than 2000)
const delayBetweenFrames = 1000; // delay between frames
const retryTimeout = 50; // delay between retries
const debug = false; // whether to log every pixel result




// imports
import { Jimp, intToRGBA } from "jimp"; // loading frames and converting to pixels
import { setTimeout as setTimeoutPromise } from "node:timers/promises"; // delay in between requests
import { ProxyAgent } from "undici"; // tor ip rotator proxy
import io from "socket.io-client"; // socket.io for pixel updates
import { readdir } from "node:fs/promises"; // reading framelist

// stats
let success = 0;
let errors = 0;
let x = 0;
let y = 0;
let drawnframes = 0;
let startedDrawing = 0;
let loaded = skipFrames;
let statsIntervalId = null;

const files = (await readdir(frameDir)).sort();
const frames = [];
let previousFrame = null;
let frame = null;
let fullyLoaded = false;

async function loadFrames() { // loads frames
    const limit = loaded + framesToLoad;
    for (let i = loaded; i < limit; ++i) {
        console.log(`Loading frame ${i} | filename ${files[i]}`);
        const file = files[i];
        if (!file) {
            console.log(`No more frames past frame ${i}, aborting as finished`);
            fullyLoaded = true;
            return;
        }
        const url = `./frames/${file}`;
        
        const jimp = (await Jimp.read(url)).resize({
            w: targetWidth,
            h: targetHeight
        });
        
        
        const pixels = [];
        for (let a = 0; a < targetWidth; ++a) {
            pixels.push([]);
            for (let b = 0; b < targetHeight; ++b) {
                pixels[a].push(intToRGBA(jimp.getPixelColor(a, b)));
            }
        }
        frames.push(pixels);
        ++loaded;
    }
    console.log(`Converted ${frames.length} frames into ${frames[0].length * frames[0][0].length} pixels`);
}

function drawPixel(body, retries = 0) { // body = { x, y, r, g, b } 
    return fetch(apiUrl, {
        dispatcher: proxyUrl ? new ProxyAgent(proxyUrl) : undefined,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
    }).then(async resp => {
        if (debug) console.log(`Drawing at ${body.x} ${body.y} with colors ${body.r} ${body.g} ${body.b} | ${resp.status} ${resp.statusText}`);
        if (!resp.ok) { // ratelimit/error)
            ++errors;
            if (retries > maxRetries) {
                if (debug) console.log(`Max retries reached drawing pixel at ${body.x} ${body.y}`);
                return;
            } else if (debug) console.log(`Retrying drawing pixel at ${body.x} ${body.y} | Attempt ${retries + 1}`);
            if (retryTimeout) await setTimeoutPromise(retryTimeout);
            return await drawPixel(body, retries + 1);
        }
        ++success;
        return resp;
    }).catch(async e => { // socket error
        ++errors;
        if (retries > maxRetries) return;
        console.error(`Error drawing at ${body.x} ${body.y} | Attempt ${retries + 1} | `, (debug ? e : (e.cause?.message || e.message || e)));
        if (retryTimeout) await setTimeoutPromise(retryTimeout);
        return await drawPixel(body, retries + 1);
    });
}

await loadFrames();

if (socketUrl) { // if socket.io url is set listen for pixel updates
    const socket = io(socketUrl);

    socket.on("pixelUpdated", (body) => {
        if (body.x >= startAtX && body.x < startAtX + targetWidth && body.y >= startAtY && body.y < startAtY + targetHeight) {
            const { r, g, b } = frame?.[body.x - startAtX][body.y - startAtY];
            if (body.r == r && body.g == g && body.b == b) return;
            if (debug) console.log(`Pixel at ${body.x} ${body.y} was ruined, fixing from ${body.r} ${body.g} ${body.b} to ${r} ${g} ${b}...`);
            drawPixel({
                x: body.x,
                y: body.y,
                r,
                g,
                b
            });
        }
    });
}

if (statsInterval) statsIntervalId = setInterval(() => { // show stats about drawn pixels
    console.log(`Success - ${success}\nErrors - ${errors}\nSuccess ratio - ${success / (success + errors) * 100}%`);
}, statsInterval);

frame = frames.shift();
startedDrawing = Date.now();
console.log(`Drawing initial frame ${drawnframes + skipFrames}...`);

for(;;) { // main loop
    switch(fillMethod) {
        case 1: { // horizontal
            ++x;
            if (x >= targetWidth) { // next row
                x = 0;
                ++y
            }
            break;
        }
        case 2: { // vertical
            ++y;
            if (y >= targetHeight) { // next column
                y = 0;
                ++x
            }
            break;
        }
        default: {
            throw new Error(`Unknown fill method: ${fillMethod}`);
        }
    }
    if ((fillMethod == 1 && y >= targetHeight) || (fillMethod == 2 && x >= targetWidth)) { // next frame
        y = 0;
        x = 0;
        console.log(`Took ${~~((Date.now() - startedDrawing)/1000)} seconds`);
        startedDrawing = Date.now();
        previousFrame = frame;
        frame = frames.shift();
        ++drawnframes;
        console.log(`Drawing frame ${drawnframes + skipFrames}...`);
        if (!fullyLoaded && (frames.length < reloadFramesAt)) loadFrames();
        if (!frame) {
            console.log(`All frames drawn! Stopping main loop...`);
            clearInterval(statsIntervalId);
            if (socketUrl && socket?.connected) socket?.disconnect();
            break;
        }
        if (delayBetweenFrames) await setTimeoutPromise(delayBetweenFrames);
    }

    const { r, g, b } = frame?.[x]?.[y];
    if (skipUnchangedPixels && previousFrame) { // if we have a previous frame, check if the pixel is the same and skip
        const { r: pr, g: pg, b: pb } = previousFrame?.[x][y];
        if (pr == r && pg == g && pb == b) {
            if (debug) console.log(`Pixel at ${x} ${y} is the same, skipping...`);
            continue;
        } else if (debug) console.log(`Pixel at ${x} ${y} is not the same, drawing...`);
    } else if (debug) console.log(`No previous frame to compare pixel ${x} ${y} against, drawing...`);

    await setTimeoutPromise(delay);
    
    drawPixel({
        x: x + startAtX,
        y: y + startAtY,
        r,
        g,
        b
    });
}