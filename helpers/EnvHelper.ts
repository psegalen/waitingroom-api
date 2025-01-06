export const emptyEnvVar = "emptyEnvVar";

type Env = "DEV" | "STAGING" | "PRODUCTION" | "TEST" | "LOCAL";
const defaultEnv: Env = "DEV";
// const getEnvNumber = (envValue?: string) => (envValue ? parseInt(envValue) : -1);
const getEnvString = (envValue?: string, fallback?: string): string => envValue || fallback || emptyEnvVar;

const apiEnv = getEnvString(process.env.API_ENV, defaultEnv) as Env;
const envIsDebuggable = (): boolean => apiEnv === defaultEnv || apiEnv === "TEST" || apiEnv === "LOCAL";

export default {
  apiEnv,
  envIsDebuggable,
  dbConnectionString: getEnvString(process.env.DB_CONNECTION_STRING),
  dbName: getEnvString(process.env.DB_NAME),
};
