import { Configuration } from "../ApiTypes";
import logger from "../helpers/Logger";
import MongoDataAccess from "../helpers/MongoDataAccess";

const configDa = new MongoDataAccess<Configuration>("Configuration");

export const getConfigs = async (): Promise<Configuration[]> => {
  try {
    const configs = await configDa.getDocs();
    return configs || [];
  } catch (error) {
    logger.error("Error in getConfigs", error);
    return [];
  }
};

export const getConfigById = async (id: string): Promise<Configuration> => {
  return await configDa.getDocById(id);
};

export const createConfig = async (config: Configuration): Promise<Configuration> => {
  return await configDa.createDoc(config);
};

export const updateConfig = async (config: Configuration): Promise<Configuration> => {
  return await configDa.updateDoc(config);
};

export const deleteConfig = async (id: string): Promise<boolean> => {
  return await configDa.deleteDocById(id);
};
