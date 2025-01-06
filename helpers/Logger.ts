import { InvocationContext } from "@azure/functions";
import EnvHelper from "./EnvHelper";

class Logger {
  context: InvocationContext;

  init(c: InvocationContext, funcUrl: string): void {
    this.context = c;
    this.debug(`API request start "${funcUrl}"`);
  }

  debug(msg: string, ...args: unknown[]): void {
    if (EnvHelper.envIsDebuggable()) {
      this.context.log(msg, ...args);
    }
    return null;
  }
  info(msg: string, ...args: unknown[]): void {
    this.context.log(msg, ...args);
    return null;
  }
  warn(msg: string, ...args: unknown[]): void {
    this.context.warn(msg, ...args);
    return null;
  }
  error(msg: string, ...args: unknown[]): void {
    this.context.error(msg, ...args);
    return null;
  }
}

const logger = new Logger();

export default logger;
