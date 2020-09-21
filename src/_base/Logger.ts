// @flow

const isConsoleDisabled = process.env.NODE_ENV === 'production';

export default {
  log(msg: string) {
    if (!isConsoleDisabled) {
      console.log(msg);
    }
  },
  warn(msg: string) {
    if (!isConsoleDisabled) {
      console.warn(msg);
    }
  },
  info(msg: string) {
    if (!isConsoleDisabled) {
      console.info(msg);
    }
  },
  error(msg: string) {
    if (!isConsoleDisabled) {
      console.error(msg);
    }
  },
  debug(msg: string) {
    if (!isConsoleDisabled) {
      console.debug(msg);
    }
  },
};
