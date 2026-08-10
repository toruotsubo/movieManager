"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron2 = require("electron");
var import_path2 = __toESM(require("path"));
var import_fs2 = __toESM(require("fs"));
var import_url = __toESM(require("url"));

// electron/db/index.ts
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_electron = require("electron");

// src/lib/utils.ts
function getSplitValues(val) {
  if (val === null || val === void 0 || val === "") {
    return ["\u672A\u8A2D\u5B9A"];
  }
  const str = String(val);
  const parts = Array.from(
    new Set(
      str.split(/[,|、|，]/).map((s) => s.trim()).filter(Boolean)
    )
  );
  return parts.length > 0 ? parts : ["\u672A\u8A2D\u5B9A"];
}
function getKanaForCast(cast, castKana, targetCastVal) {
  if (!cast || !castKana) return null;
  const castSplits = cast.split(/[,|、|，]/).map((s) => s.trim()).filter(Boolean);
  const kanaSplits = castKana.split(/[,|、|，]/).map((s) => s.trim()).filter(Boolean);
  if (castSplits.length === 0 || kanaSplits.length === 0) return null;
  const idx = castSplits.findIndex((c) => c === targetCastVal.trim());
  if (idx !== -1) {
    if (idx < kanaSplits.length) {
      return kanaSplits[idx];
    } else {
      return kanaSplits[kanaSplits.length - 1];
    }
  }
  return null;
}

// electron/db/index.ts
var jsonDb = null;
var dbFilePath = "";
function initDatabase() {
  const userDataPath = import_electron.app.getPath("userData");
  const dbDir = import_path.default.join(userDataPath, "db");
  if (!import_fs.default.existsSync(dbDir)) {
    import_fs.default.mkdirSync(dbDir, { recursive: true });
  }
  dbFilePath = import_path.default.join(dbDir, "movie_manager.json");
  if (import_fs.default.existsSync(dbFilePath)) {
    try {
      jsonDb = JSON.parse(import_fs.default.readFileSync(dbFilePath, "utf-8"));
    } catch (err) {
      console.error("Failed to parse database file, resetting:", err);
      jsonDb = null;
    }
  }
  if (!jsonDb) {
    jsonDb = {
      settings: {
        id: 1,
        is_initialized: false,
        custom_field_1_name: null,
        custom_field_2_name: null,
        custom_field_3_name: null,
        key_fields: ["genre", "cast"]
      },
      movies: [],
      keyRatings: {},
      keyTags: {}
    };
    saveDatabase();
  }
  console.log("Database initialized successfully at:", dbFilePath);
}
function saveDatabase() {
  if (jsonDb && dbFilePath) {
    import_fs.default.writeFileSync(dbFilePath, JSON.stringify(jsonDb, null, 2), "utf-8");
  }
}
function getAppSettings() {
  if (!jsonDb) initDatabase();
  return jsonDb.settings;
}
function saveAppSettings(input) {
  if (!jsonDb) initDatabase();
  jsonDb.settings = {
    ...jsonDb.settings,
    ...input,
    is_initialized: input.is_initialized !== void 0 ? input.is_initialized : jsonDb.settings.is_initialized,
    key_fields: input.key_fields || jsonDb.settings.key_fields
  };
  saveDatabase();
  return jsonDb.settings;
}
function getAllMovies() {
  if (!jsonDb) initDatabase();
  return [...jsonDb.movies].sort((a, b) => b.id - a.id);
}
function getMovieById(id) {
  if (!jsonDb) initDatabase();
  return jsonDb.movies.find((m) => m.id === id) || null;
}
function getMovieByFilePath(filePath) {
  if (!jsonDb) initDatabase();
  return jsonDb.movies.find((m) => m.file_path === filePath) || null;
}
function addMovie(movie) {
  if (!jsonDb) initDatabase();
  const existing = getMovieByFilePath(movie.file_path);
  if (existing) {
    return updateMovie({ ...movie, id: existing.id });
  }
  const newId = jsonDb.movies.length > 0 ? Math.max(...jsonDb.movies.map((m) => m.id)) + 1 : 1;
  const newMovie = {
    id: newId,
    file_path: movie.file_path,
    file_name: movie.file_name,
    summary_image_path: movie.summary_image_path || null,
    title: movie.title || null,
    genre: movie.genre || null,
    cast: movie.cast || null,
    cast_kana: movie.cast_kana || null,
    release_year: movie.release_year || null,
    release_date: movie.release_date || null,
    rating: movie.rating !== void 0 ? movie.rating : 3,
    comment: movie.comment || null,
    tags: movie.tags || null,
    custom_field_1: movie.custom_field_1 || null,
    custom_field_2: movie.custom_field_2 || null,
    custom_field_3: movie.custom_field_3 || null,
    duration: movie.duration || null,
    is_grouped: movie.is_grouped !== void 0 ? movie.is_grouped : false,
    parent_movie_id: movie.parent_movie_id !== void 0 ? movie.parent_movie_id : null,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  jsonDb.movies.push(newMovie);
  saveDatabase();
  return newMovie;
}
function updateMovie(movie) {
  if (!jsonDb) initDatabase();
  const index = jsonDb.movies.findIndex((m) => m.id === movie.id);
  if (index === -1) throw new Error(`Movie with id ${movie.id} not found.`);
  jsonDb.movies[index] = {
    ...jsonDb.movies[index],
    ...movie,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveDatabase();
  return jsonDb.movies[index];
}
function deleteMovie(id) {
  if (!jsonDb) initDatabase();
  const index = jsonDb.movies.findIndex((m) => m.id === id);
  if (index !== -1) {
    jsonDb.movies.splice(index, 1);
    saveDatabase();
    return true;
  }
  return false;
}
function updateMovieRating(id, rating) {
  if (!jsonDb) initDatabase();
  const movie = jsonDb.movies.find((m) => m.id === id);
  if (!movie) throw new Error(`Movie with id ${id} not found.`);
  movie.rating = rating;
  movie.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  saveDatabase();
  return movie;
}
function getKeyItemGroups() {
  const settings = getAppSettings();
  const keyFields = settings.key_fields;
  const movies = getAllMovies();
  if (keyFields.length === 0) return [];
  const groupsMap = /* @__PURE__ */ new Map();
  for (const movie of movies) {
    let combinations = [{}];
    for (const kf of keyFields) {
      const values = getSplitValues(movie[kf]);
      const nextCombinations = [];
      for (const comb of combinations) {
        for (const val of values) {
          nextCombinations.push({ ...comb, [kf]: val });
        }
      }
      combinations = nextCombinations;
    }
    for (const keyValues of combinations) {
      const signature = JSON.stringify(keyValues);
      if (!groupsMap.has(signature)) {
        groupsMap.set(signature, { keyValues, movies: [] });
      }
      groupsMap.get(signature).movies.push(movie);
    }
  }
  const result = [];
  for (const [signature, group] of groupsMap.entries()) {
    const sortedMovies = [...group.movies].sort((a, b) => b.rating - a.rating);
    const topMovie = sortedMovies.find((m) => m.summary_image_path) || sortedMovies[0];
    const groupRating = jsonDb.keyRatings[signature] !== void 0 ? jsonDb.keyRatings[signature] : 3;
    let sortKey = Object.values(group.keyValues).join(" / ");
    if (keyFields.includes("cast")) {
      const targetCastVal = group.keyValues["cast"];
      let foundKana = "";
      for (const movie of group.movies) {
        const kana = getKanaForCast(movie.cast, movie.cast_kana, targetCastVal);
        if (kana) {
          foundKana = kana;
          break;
        }
      }
      if (foundKana) {
        sortKey = foundKana;
      }
    }
    const tags = jsonDb.keyTags && jsonDb.keyTags[signature] ? jsonDb.keyTags[signature] : null;
    result.push({
      key_signature: signature,
      key_values: group.keyValues,
      sort_key: sortKey,
      summary_image_path: topMovie ? topMovie.summary_image_path : null,
      rating: groupRating,
      movie_count: group.movies.length,
      tags
    });
  }
  return result;
}
function updateKeyItemRating(key_signature, rating) {
  if (!jsonDb) initDatabase();
  jsonDb.keyRatings[key_signature] = rating;
  saveDatabase();
}
function updateKeyItemDetails(input) {
  if (!jsonDb) initDatabase();
  if (!jsonDb.keyTags) jsonDb.keyTags = {};
  const { key_signature, cast_kana, tags } = input;
  if (tags !== void 0) {
    jsonDb.keyTags[key_signature] = tags || "";
  }
  if (cast_kana !== void 0) {
    const settings = getAppSettings();
    const keyFields = settings.key_fields;
    const movies = jsonDb.movies;
    let targetCastVal = null;
    try {
      const parsedKeyValues = JSON.parse(key_signature);
      if (parsedKeyValues && typeof parsedKeyValues === "object" && parsedKeyValues.cast) {
        targetCastVal = parsedKeyValues.cast;
      }
    } catch (e) {
      console.error("Failed to parse key_signature in updateKeyItemDetails:", e);
    }
    for (const movie of movies) {
      let combinations = [{}];
      for (const kf of keyFields) {
        const values = getSplitValues(movie[kf]);
        const nextCombinations = [];
        for (const comb of combinations) {
          for (const val of values) {
            nextCombinations.push({ ...comb, [kf]: val });
          }
        }
        combinations = nextCombinations;
      }
      const isMatch = combinations.some((comb) => JSON.stringify(comb) === key_signature);
      if (isMatch) {
        if (targetCastVal && movie.cast) {
          const castSplits = movie.cast.split(/[,|、|，]/).map((s) => s.trim()).filter(Boolean);
          const kanaSplits = movie.cast_kana ? movie.cast_kana.split(/[,|、|，]/).map((s) => s.trim()).filter(Boolean) : [];
          const idx = castSplits.findIndex((c) => c === targetCastVal.trim());
          if (idx !== -1) {
            const updatedKanaSplits = [...kanaSplits];
            while (updatedKanaSplits.length <= idx) {
              const lastKana = updatedKanaSplits.length > 0 ? updatedKanaSplits[updatedKanaSplits.length - 1] : "";
              updatedKanaSplits.push(lastKana);
            }
            updatedKanaSplits[idx] = cast_kana || "";
            movie.cast_kana = updatedKanaSplits.join(",");
          } else {
            movie.cast_kana = cast_kana;
          }
        } else {
          movie.cast_kana = cast_kana;
        }
        movie.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
  }
  saveDatabase();
}
function resetAllData() {
  if (!jsonDb) initDatabase();
  try {
    const userDataPath = import_electron.app.getPath("userData");
    const thumbDir = import_path.default.join(userDataPath, "thumbnails");
    if (import_fs.default.existsSync(thumbDir)) {
      import_fs.default.rmSync(thumbDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Failed to clear thumbnails directory:", err);
  }
  jsonDb = {
    settings: {
      id: 1,
      is_initialized: false,
      custom_field_1_name: null,
      custom_field_2_name: null,
      custom_field_3_name: null,
      key_fields: ["genre"]
    },
    movies: [],
    keyRatings: {},
    keyTags: {}
  };
  saveDatabase();
  return jsonDb.settings;
}

// electron/main.ts
import_electron2.protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  },
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  }
]);
var isDev = !import_electron2.app.isPackaged && process.env.NODE_ENV !== "production";
var mainWindow = null;
function createWindow() {
  mainWindow = new import_electron2.BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "Movie Manager",
    autoHideMenuBar: true,
    webPreferences: {
      preload: import_path2.default.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });
  mainWindow.setMenu(null);
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL("app://localhost/");
  }
}
function registerAppProtocol() {
  import_electron2.protocol.handle("app", (request) => {
    try {
      const reqUrl = new URL(request.url);
      let pathname = decodeURIComponent(reqUrl.pathname);
      const outDir = import_path2.default.join(__dirname, "../out");
      if (pathname === "/" || pathname === "") {
        pathname = "/index.html";
      }
      let filePath = import_path2.default.join(outDir, pathname);
      if (!import_fs2.default.existsSync(filePath)) {
        if (import_fs2.default.existsSync(filePath + ".html")) {
          filePath = filePath + ".html";
        } else if (import_fs2.default.existsSync(import_path2.default.join(filePath, "index.html"))) {
          filePath = import_path2.default.join(filePath, "index.html");
        } else {
          filePath = import_path2.default.join(outDir, "index.html");
        }
      } else if (import_fs2.default.statSync(filePath).isDirectory()) {
        const indexPath = import_path2.default.join(filePath, "index.html");
        if (import_fs2.default.existsSync(indexPath)) {
          filePath = indexPath;
        }
      }
      return import_electron2.net.fetch(import_url.default.pathToFileURL(filePath).toString());
    } catch (error) {
      console.error("Failed to handle app protocol:", error);
      return new Response("Not Found", { status: 404 });
    }
  });
}
function registerMediaProtocol() {
  import_electron2.protocol.registerFileProtocol("media", (request, callback) => {
    try {
      let rawUrl = request.url.replace(/^media:\/\/(local\/)?/, "");
      let cleanUrl = rawUrl.split("?")[0].split("#")[0];
      let decodedPath = decodeURIComponent(cleanUrl);
      if (process.platform === "win32") {
        if (/^\/[a-zA-Z]:/.test(decodedPath)) {
          decodedPath = decodedPath.slice(1);
        }
      }
      const normalizedPath = import_path2.default.normalize(decodedPath);
      callback({ path: normalizedPath });
    } catch (error) {
      console.error("Failed to handle media file protocol:", error);
      callback({ error: -6 });
    }
  });
}
import_electron2.app.whenReady().then(() => {
  import_electron2.Menu.setApplicationMenu(null);
  registerAppProtocol();
  registerMediaProtocol();
  initDatabase();
  createWindow();
  import_electron2.app.on("activate", () => {
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron2.app.quit();
});
import_electron2.ipcMain.handle("settings:get", async () => getAppSettings());
import_electron2.ipcMain.handle("settings:save", async (_, input) => saveAppSettings(input));
import_electron2.ipcMain.handle("movies:getAll", async () => getAllMovies());
import_electron2.ipcMain.handle("movies:getById", async (_, id) => getMovieById(id));
import_electron2.ipcMain.handle("movies:getByPath", async (_, filePath) => getMovieByFilePath(filePath));
import_electron2.ipcMain.handle("movies:add", async (_, movie) => addMovie(movie));
import_electron2.ipcMain.handle("movies:update", async (_, movie) => updateMovie(movie));
import_electron2.ipcMain.handle("movies:delete", async (_, id) => deleteMovie(id));
import_electron2.ipcMain.handle(
  "movies:updateRating",
  async (_, { id, rating }) => updateMovieRating(id, rating)
);
import_electron2.ipcMain.handle("keyItems:getAll", async () => getKeyItemGroups());
import_electron2.ipcMain.handle(
  "keyItems:updateRating",
  async (_, { key_signature, rating }) => updateKeyItemRating(key_signature, rating)
);
import_electron2.ipcMain.handle(
  "keyItems:updateDetails",
  async (_, input) => updateKeyItemDetails(input)
);
import_electron2.ipcMain.handle("app:resetData", async () => resetAllData());
import_electron2.ipcMain.handle("app:openMoviePlayer", async (_, filePath) => {
  try {
    if (!import_fs2.default.existsSync(filePath)) {
      return { success: false, error: "\u6307\u5B9A\u3055\u308C\u305F\u52D5\u753B\u30D5\u30A1\u30A4\u30EB\u304C\u5B58\u5728\u3057\u307E\u305B\u3093\u3002" };
    }
    const errorMsg = await import_electron2.shell.openPath(filePath);
    if (errorMsg) {
      return { success: false, error: errorMsg };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || "\u52D5\u753B\u30D7\u30EC\u30A4\u30E4\u30FC\u306E\u8D77\u52D5\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" };
  }
});
import_electron2.ipcMain.handle("app:saveSummaryImage", async (_, base64Data) => {
  try {
    const userDataPath = import_electron2.app.getPath("userData");
    const thumbDir = import_path2.default.join(userDataPath, "thumbnails");
    if (!import_fs2.default.existsSync(thumbDir)) {
      import_fs2.default.mkdirSync(thumbDir, { recursive: true });
    }
    const filename = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    const fullPath = import_path2.default.join(thumbDir, filename);
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    import_fs2.default.writeFileSync(fullPath, buffer);
    return fullPath;
  } catch (err) {
    console.error("Failed to save summary image:", err);
    throw new Error("\u30B5\u30DE\u30EA\u30FC\u753B\u50CF\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  }
});
