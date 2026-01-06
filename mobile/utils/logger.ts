export function debug(...args: any[]) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log(...args);
  }
}

export function info(...args: any[]) {
  console.log(...args);
}

export function warn(...args: any[]) {
  console.warn(...args);
}

export function error(...args: any[]) {
  console.error(...args);
}
