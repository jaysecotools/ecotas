const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
let currentLevel = LEVELS.info;

export function setLevel(level) {
  if (LEVELS[level]) currentLevel = LEVELS[level];
}

function log(level, ...args) {
  if (LEVELS[level] < currentLevel) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level === "debug" ? "log" : level](`[${ts}] [${level}]`, ...args);
}

export const logger = {
  debug: (...a) => log("debug", ...a),
  info:  (...a) => log("info", ...a),
  warn:  (...a) => log("warn", ...a),
  error: (...a) => log("error", ...a),
};
