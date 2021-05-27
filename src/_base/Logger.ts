const isConsoleDisabled = process.env.NODE_ENV === 'production';

export default {
  log(msg: string): void {
    if (!isConsoleDisabled) {
      console.log(msg);
    }
  },
  warn(msg: string): void {
    if (!isConsoleDisabled) {
      console.warn(msg);
    }
  },
  info(msg: string): void {
    if (!isConsoleDisabled) {
      console.info(msg);
    }
  },
  error(msg: string): void {
    if (!isConsoleDisabled) {
      console.error(msg);
    }
  },
  debug(msg: string): void {
    if (!isConsoleDisabled) {
      console.debug(msg);
    }
  },
};
