import "./style.css";

import { SpriteInfo, ref, debounce, debug, loadImage, type Context } from "./common";
import { Context as Context_Canvas2D } from "./canvas2d";
import { Context as Context_WebGL2 } from "./webgl2";
import Geometry from "./Geometry";

enum PieceEdge {
  Flat = 0,
  Out = 1,
  In = -1,
}
export interface PieceShape {
  top: PieceEdge;
  bottom: PieceEdge;
  left: PieceEdge;
  right: PieceEdge;
}

const createStencilTextures = async () => {
  const CURVY_COORDS = [
    0, 0, 40, 15, 37, 5, 37, 5, 40, 0, 38, -5, 38, -5, 20, -20, 50, -20, 50,
    -20, 80, -20, 62, -5, 62, -5, 60, 0, 63, 5, 63, 5, 65, 15, 100, 0,
  ];

  function createPathForShape(
    shape: PieceShape,
    x: number,
    y: number,
    pieceSize: number
  ) {
    const pieceRatio = pieceSize / 100.0;
    const path = new Path2D();
    const topLeftEdge = { x, y };
    const topRightEdge = Geometry.pointAdd(topLeftEdge, { x: pieceSize, y: 0 });
    const bottomRightEdge = Geometry.pointAdd(topRightEdge, {
      x: 0,
      y: pieceSize,
    });
    const bottomLeftEdge = Geometry.pointSub(bottomRightEdge, {
      x: pieceSize,
      y: 0,
    });

    path.moveTo(topLeftEdge.x, topLeftEdge.y);
    if (shape.top !== 0) {
      for (let i = 0; i < CURVY_COORDS.length / 6; i++) {
        const p1 = Geometry.pointAdd(topLeftEdge, {
          x: CURVY_COORDS[i * 6 + 0] * pieceRatio,
          y: shape.top * CURVY_COORDS[i * 6 + 1] * pieceRatio,
        });
        const p2 = Geometry.pointAdd(topLeftEdge, {
          x: CURVY_COORDS[i * 6 + 2] * pieceRatio,
          y: shape.top * CURVY_COORDS[i * 6 + 3] * pieceRatio,
        });
        const p3 = Geometry.pointAdd(topLeftEdge, {
          x: CURVY_COORDS[i * 6 + 4] * pieceRatio,
          y: shape.top * CURVY_COORDS[i * 6 + 5] * pieceRatio,
        });
        path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
    } else {
      path.lineTo(topRightEdge.x, topRightEdge.y);
    }
    if (shape.right !== 0) {
      for (let i = 0; i < CURVY_COORDS.length / 6; i++) {
        const p1 = Geometry.pointAdd(topRightEdge, {
          x: -shape.right * CURVY_COORDS[i * 6 + 1] * pieceRatio,
          y: CURVY_COORDS[i * 6 + 0] * pieceRatio,
        });
        const p2 = Geometry.pointAdd(topRightEdge, {
          x: -shape.right * CURVY_COORDS[i * 6 + 3] * pieceRatio,
          y: CURVY_COORDS[i * 6 + 2] * pieceRatio,
        });
        const p3 = Geometry.pointAdd(topRightEdge, {
          x: -shape.right * CURVY_COORDS[i * 6 + 5] * pieceRatio,
          y: CURVY_COORDS[i * 6 + 4] * pieceRatio,
        });
        path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
    } else {
      path.lineTo(bottomRightEdge.x, bottomRightEdge.y);
    }
    if (shape.bottom !== 0) {
      for (let i = 0; i < CURVY_COORDS.length / 6; i++) {
        const p1 = Geometry.pointSub(bottomRightEdge, {
          x: CURVY_COORDS[i * 6 + 0] * pieceRatio,
          y: shape.bottom * CURVY_COORDS[i * 6 + 1] * pieceRatio,
        });
        const p2 = Geometry.pointSub(bottomRightEdge, {
          x: CURVY_COORDS[i * 6 + 2] * pieceRatio,
          y: shape.bottom * CURVY_COORDS[i * 6 + 3] * pieceRatio,
        });
        const p3 = Geometry.pointSub(bottomRightEdge, {
          x: CURVY_COORDS[i * 6 + 4] * pieceRatio,
          y: shape.bottom * CURVY_COORDS[i * 6 + 5] * pieceRatio,
        });
        path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
    } else {
      path.lineTo(bottomLeftEdge.x, bottomLeftEdge.y);
    }
    if (shape.left !== 0) {
      for (let i = 0; i < CURVY_COORDS.length / 6; i++) {
        const p1 = Geometry.pointSub(bottomLeftEdge, {
          x: -shape.left * CURVY_COORDS[i * 6 + 1] * pieceRatio,
          y: CURVY_COORDS[i * 6 + 0] * pieceRatio,
        });
        const p2 = Geometry.pointSub(bottomLeftEdge, {
          x: -shape.left * CURVY_COORDS[i * 6 + 3] * pieceRatio,
          y: CURVY_COORDS[i * 6 + 2] * pieceRatio,
        });
        const p3 = Geometry.pointSub(bottomLeftEdge, {
          x: -shape.left * CURVY_COORDS[i * 6 + 5] * pieceRatio,
          y: CURVY_COORDS[i * 6 + 4] * pieceRatio,
        });
        path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      }
    } else {
      path.lineTo(topLeftEdge.x, topLeftEdge.y);
    }
    return path;
  }

  const shapes = [];
  shapes.push(
    // createPathForShape({ top: 0, bottom: 0, left: 0, right: 0 }, 0, 0, 128)
    // createPathForShape({ top: 0, bottom: 0, left: 0, right: 0 }, 20, 20, 104)
    // createPathForShape({ top: 0, bottom: 0, left: 0, right: 0 }, SPRITE_DRAW_OFFSET, SPRITE_DRAW_OFFSET, SPRITE_SIZE)
  );

  for (let top = -1; top <= 1; top++) {
    for (let bottom = -1; bottom <= 1; bottom++) {
      for (let left = -1; left <= 1; left++) {
        for (let right = -1; right <= 1; right++) {
          shapes.push(
            createPathForShape({ top, bottom, left, right }, SPRITE_DRAW_OFFSET, SPRITE_DRAW_OFFSET, SPRITE_SIZE)
          );
        }
      }
    }
  }

  const res: [string, ImageBitmap][] = [];
  for (const [index, shape] of shapes.entries()) {
    const canvas = document.createElement("canvas");
    canvas.width = SPRITE_SIZE + 2* SPRITE_DRAW_OFFSET;
    canvas.height = SPRITE_SIZE + 2 * SPRITE_DRAW_OFFSET;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fill(shape);
    res.push([`shape ${index}`, await createImageBitmap(canvas)]);
  }
  return res;
};

const SPRITE_SIZE = 64;
const SPRITE_DRAW_OFFSET = 20;

const SPRITE_POS_OFFSET = 0;
const textures = await createStencilTextures();
const texturesBg: [string, ImageBitmap][] = await Promise.all([
  // puzzle texture
  loadImage("assets/ss.png"),
]);

function spriteAt(
  textures: [string, ImageBitmap][],
  rows: number,
  cols: number,
  i: number
): SpriteInfo {
  // wrap around back to start if `i` exceeds rows * cols
  i = i % (rows * cols);
  const x = i % cols;
  const y = Math.floor(i / cols);
  const texture = textures[i % textures.length][0];
  return { texture, x: x * (SPRITE_SIZE + SPRITE_POS_OFFSET) + SPRITE_POS_OFFSET, y: y * (SPRITE_SIZE + SPRITE_POS_OFFSET) + SPRITE_POS_OFFSET };
}

function spriteGrid(
  textures: [string, ImageBitmap][],
  rows: number,
  cols: number
) {
  const sprites: SpriteInfo[] = [];
  for (let i = 0; i < rows * cols; i++) {
    sprites.push(spriteAt(textures, rows, cols, i));
  }
  return debug(sprites);
}

const dropdown = document.getElementById("renderer") as HTMLSelectElement;
let dropdownValue = ref(dropdown.value);
dropdown.addEventListener("change", () => {
  dropdownValue.set(dropdown.value);
});

const slider = document.getElementById("count") as HTMLInputElement;
let sliderValue = ref(slider.valueAsNumber);
slider.addEventListener("input", () => {
  sliderValue.set(slider.valueAsNumber);
  const label = slider.labels?.[0];
  if (label) {
    label.textContent = slider.value;
  }
});

const canvasContainer = document.getElementById("canvas-container") as HTMLDivElement;

let stop = () => {};

function start(renderer: typeof Context, count: number) {
  stop();

  const canvas = document.createElement("canvas");
  canvas.width = canvasContainer.clientWidth;
  canvas.height = canvasContainer.clientHeight;
  canvasContainer.innerHTML = "";
  canvasContainer.appendChild(canvas);

  // split count by aspect ratio of canvas
  const aspectRatio = canvas.width / canvas.height;
  const cols = Math.round(Math.sqrt(count * aspectRatio));
  const rows = Math.ceil(count / cols);

  const ctx = new renderer(canvas);
  ctx.setup(
    textures,
    texturesBg,
    spriteGrid(textures, 4, 4),
    SPRITE_SIZE
  );

  stop = () => {
    cancelAnimationFrame(raf);
    canvas.remove();
    ctx.destroy();
  };

  let raf = 0;
  function loop() {
    ctx.update();
    ctx.render();
    raf = requestAnimationFrame(loop);
  }

  loop();
}

function run() {
  if (dropdownValue.current === "canvas2d") {
    start(Context_Canvas2D, sliderValue.current);
  } else if (dropdownValue.current === "webgl2") {
    start(Context_WebGL2, sliderValue.current);
  }
}

const runDebounced = debounce(() => run(), 100);

sliderValue.subscribe(runDebounced);
dropdownValue.subscribe(runDebounced);
runDebounced();

