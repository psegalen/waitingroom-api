/* eslint-disable @typescript-eslint/no-unused-vars */
import { Sort } from "mongodb";
import { MongoDocument } from "../ApiTypes";
import { filterBySelector, getFromCache, removeFromCache, setCache, updateCache } from "./DataCache";
import MongoHelper, { DbError } from "./MongoHelper";

export enum ErrorLabel {
  NOT_FOUND = "Not found",
  ALREADY_EXISTS = "Already exists",
  UNAUTHORIZED = "Unauthorized",
  UNKNOWN = "Unknown error",
  UNSUPPORTED = "Unsupported operation",
  NOT_POSSIBLE = "Not possible",
}

export default class MongoDataAccess<T extends MongoDocument> {
  collectionName: string;
  cacheData: boolean;

  constructor(collection: string, activateCache = true) {
    this.collectionName = collection;
    this.cacheData = activateCache;
  }

  getDocs = async (sort?: Record<string, unknown>): Promise<T[]> => {
    if (this.cacheData) {
      const cacheData = getFromCache<T>(this.collectionName);
      if (cacheData) return cacheData;
    }
    const data = await MongoHelper.getDocumentsForCollection(this.collectionName, {}, sort as Sort);
    setCache(this.collectionName, data);
    return data as T[];
  };
  getDocsBySelector = async (
    selector: Record<string, unknown>,
    sort?: Record<string, unknown>,
    avoidCache?: boolean,
  ): Promise<T[]> => {
    if (!this.cacheData) {
      return (await MongoHelper.getDocumentsForCollection(this.collectionName, selector, sort as Sort)) as T[];
    }
    const collection = await this.getDocs(sort);
    const result = filterBySelector(collection, selector);
    if (result.length === 0 || avoidCache) {
      // Probable cache miss (or cache refresh was forced)
      const data = await MongoHelper.getDocumentsForCollection(this.collectionName, selector, sort as Sort);
      if (data.length === 0) throw new Error(ErrorLabel.NOT_FOUND);
      updateCache(this.collectionName, data[0]);
      return data as T[];
    }
    return result;
  };
  getDocBySelector = async (
    selector: Record<string, unknown>,
    sort?: Record<string, unknown>,
    avoidCache?: boolean,
  ): Promise<T> => {
    return (await this.getDocsBySelector(selector, sort, avoidCache))?.[0];
  };
  getDocById = async (id: string, sort?: Record<string, unknown>, avoidCache?: boolean): Promise<T> => {
    return await this.getDocBySelector({ id }, sort, avoidCache);
  };
  tryGetDocBySelector = async (
    selector: Record<string, unknown>,
    sort?: Record<string, unknown>,
    avoidCache?: boolean,
  ): Promise<T | null> => {
    try {
      return await this.getDocBySelector(selector, sort, avoidCache);
    } catch (_) {
      // Ok, just no result...
      return null;
    }
  };
  tryGetDocsBySelector = async (selector: Record<string, unknown>, sort?: Record<string, unknown>): Promise<T[]> => {
    try {
      return await this.getDocsBySelector(selector, sort);
    } catch (_) {
      // Ok, just no result...
      return [];
    }
  };
  createDoc = async (doc: Partial<T>): Promise<T> => {
    const result = await MongoHelper.upsertDocument(this.collectionName, doc as MongoDocument, true);

    if (result === DbError.DOC_ALREADY_EXISTS) throw new Error(ErrorLabel.ALREADY_EXISTS);

    if (typeof result === "object" && this.cacheData) updateCache(this.collectionName, result);

    return result as T;
  };
  updateDoc = async (doc: Partial<T>, securityCheck?: Record<string, unknown>): Promise<T> => {
    const result = await MongoHelper.upsertDocument(this.collectionName, doc, false, securityCheck);

    if (result === DbError.DOC_DOES_NOT_EXIST) throw new Error(ErrorLabel.NOT_FOUND);
    if (result === DbError.SECURITY_CHECK_FAILED) throw new Error(ErrorLabel.UNAUTHORIZED);

    if (typeof result === "object" && this.cacheData) updateCache(this.collectionName, result);

    return result as T;
  };
  upsertDoc = async (doc: Partial<T>): Promise<T> => {
    const result = await MongoHelper.upsertDocument(this.collectionName, doc);
    if (typeof result === "object" && this.cacheData) updateCache(this.collectionName, result);
    return result as T;
  };
  deleteDocById = async (id: string): Promise<boolean> => {
    if (this.cacheData) removeFromCache(this.collectionName, id);
    return await MongoHelper.deleteDocumentsForCollection(this.collectionName, { id });
  };
}
