import NodeCache from "node-cache";
import logger from "./Logger";
import { MongoDocument } from "../ApiTypes";

// Default cache is 300s / 5mn (idle Azure Functions timeout)
const cacheDuration = 300;
const memCache = new NodeCache({ stdTTL: cacheDuration, checkperiod: cacheDuration / 5, useClones: false });

export const getFromCache = <T extends MongoDocument>(collectionName: string): T[] | undefined => {
  return memCache.get(collectionName);
};

export const getFromCacheById = <T extends MongoDocument>(collectionName: string, id: string): T | undefined => {
  const collection = getFromCache<T>(collectionName);
  return collection?.find((o) => o.id === id);
};

export const saveInCacheByKey = <T>(key: string, value: T): boolean => memCache.set(key, value);
export const getFromCacheByKey = <T>(key: string): T => memCache.get(key);

export const filterBySelector = <T extends MongoDocument>(
  collection: T[],
  selector: Record<string, unknown>,
): T[] | undefined => {
  const result = [];
  collection.forEach((o) => {
    let equals = true;
    Object.keys(selector).forEach((k) => {
      if (o[k] !== selector[k] && (!Array.isArray(o[k]) || o[k].indexOf(selector[k]) === -1)) equals = false;
    });
    if (equals) result.push(o);
  });
  return result;
};

export const getFromCacheBySelector = <T extends MongoDocument>(
  collectionName: string,
  selector: Record<string, unknown>,
): T | undefined => {
  const collection = getFromCache<T>(collectionName);
  if (!collection) return undefined;
  return filterBySelector(collection, selector)?.[0];
};

export const getSeveralFromCacheBySelector = <T extends MongoDocument>(
  collectionName: string,
  selector: Record<string, unknown>,
): T[] | undefined => {
  const collection = getFromCache<T>(collectionName);
  if (!collection) return undefined;
  return filterBySelector(collection, selector);
};

export const setCache = <T extends MongoDocument>(collectionName: string, values: T[]): boolean =>
  memCache.set(collectionName, values);

export const updateCache = <T extends MongoDocument>(collectionName: string, updatedValue: T): boolean => {
  const collection = getFromCache<T>(collectionName);
  if (collection) {
    let found = false;
    const newCollection = collection.map((o) => {
      if (o.id === updatedValue.id) {
        found = true;
        return updatedValue;
      }
      return o;
    });
    return memCache.set(collectionName, found ? newCollection : newCollection.concat(updatedValue));
  }
  return false;
};

export const removeFromCache = (collectionName: string, id: string): boolean => {
  const collection = getFromCache(collectionName);
  if (collection) {
    const newCollection = collection.filter((e) => e.id !== id);
    return memCache.set(collectionName, newCollection);
  }
  return true;
};

export const logStats = (): void => {
  logger.info("Mem cache stats:", memCache.getStats());
};

export const resetAllCache = (): void => {
  logger.warn("Resetting all cache...");
  memCache.flushAll();
};
