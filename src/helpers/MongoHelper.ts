import { MongoClient, Sort } from "mongodb";
import logger from "./Logger";
import EnvHelper from "./EnvHelper";
import { MongoDocument } from "../ApiTypes";

const CONNECTION_STRING = EnvHelper.dbConnectionString;
const DB_NAME = EnvHelper.dbName;

export enum DbError {
  DOC_ALREADY_EXISTS,
  DOC_DOES_NOT_EXIST,
  SECURITY_CHECK_FAILED,
}

export const getMongoNow = (): number => Math.round(new Date().getTime() / 1000);
export const getMongoDate = (d: Date): number => Math.round(d.getTime() / 1000);

const MongoHelper = {
  getDocumentsForCollection: async (
    collectionName: string,
    filter?: Record<string, unknown>,
    sort?: Sort,
  ): Promise<MongoDocument[]> => {
    console.log("🟣", CONNECTION_STRING);
    console.log("🟢", DB_NAME);
    logger.debug(`Getting documents (filter='${JSON.stringify(filter)}') for collection "${collectionName}"...`);
    let result = [];
    const client = new MongoClient(CONNECTION_STRING);
    try {
      await client.connect();
      const cursor = client.db(DB_NAME).collection(collectionName).find(filter).sort(sort);
      result = await cursor.toArray();
    } catch (e) {
      logger.error(
        `There was an error while trying to get documents (filter='${JSON.stringify(
          filter,
        )}') for collection "${collectionName}"`,
        e,
      );
      throw e;
    } finally {
      await client.close();
    }
    return result;
  },
  upsertDocument: async (
    collectionName: string,
    doc: Partial<MongoDocument>,
    create?: boolean,
    securityCheck?: Record<string, unknown>,
  ): Promise<MongoDocument | DbError> => {
    let result = null;
    const client = new MongoClient(CONNECTION_STRING);
    const filter = { id: doc.id };
    try {
      await client.connect();

      const cursor = client.db(DB_NAME).collection(collectionName).find(filter);

      const existingDoc = await cursor.next();

      if (typeof create !== "undefined") {
        if (existingDoc && create) {
          logger.error(
            `Trying to create a document (docId='${JSON.stringify(
              doc.id,
            )}') that already exists in collection "${collectionName}"`,
          );
          result = DbError.DOC_ALREADY_EXISTS;
        } else if (!existingDoc && !create) {
          logger.error(
            `Trying to update a document (docId='${JSON.stringify(
              doc.id,
            )}') that doesn't exist in collection "${collectionName}"`,
          );
          result = DbError.DOC_DOES_NOT_EXIST;
        }
        logger.debug(existingDoc ? "Updating doc..." : "Creating doc...", result);
      } else {
        logger.debug(existingDoc ? "Doc exists..." : "Doc does not exist...");
        if (existingDoc && securityCheck) {
          for (const key in securityCheck) {
            if (existingDoc[key] !== securityCheck[key]) result = DbError.SECURITY_CHECK_FAILED;
          }
        }
      }

      if (result === null) {
        const now = getMongoNow();
        const newDoc = existingDoc
          ? { ...existingDoc, ...doc, latestUpdate: now }
          : {
              ...doc,
              active: true,
              creationDate: now,
              latestUpdate: now,
            };

        const updateResult = await client
          .db(DB_NAME)
          .collection(collectionName)
          .updateOne(filter, { $set: newDoc }, { upsert: true });

        if (!updateResult.acknowledged) {
          logger.error(
            `There was an error while trying to upsert document (doc='${JSON.stringify(
              doc,
            )}') in collection "${collectionName}" >> updateResult=${JSON.stringify(updateResult)}`,
          );
          result = null;
        } else {
          result = newDoc;
        }
      }
    } catch (e) {
      logger.error(
        `There was an error while trying to upsert document (doc='${JSON.stringify(
          doc,
        )}') in collection "${collectionName}"`,
        e,
      );
      result = create ? DbError.DOC_ALREADY_EXISTS : DbError.DOC_DOES_NOT_EXIST;
    } finally {
      await client.close();
    }
    return result;
  },
  deleteDocumentsForCollection: async (collectionName: string, filter?: Record<string, unknown>): Promise<boolean> => {
    logger.debug(`Getting documents (filter='${JSON.stringify(filter)}') for collection "${collectionName}"...`);
    const client = new MongoClient(CONNECTION_STRING);
    try {
      await client.connect();

      const result = client.db(DB_NAME).collection(collectionName).deleteMany(filter);
      if ((await result).deletedCount > 0) return true;
    } catch (e) {
      logger.error(
        `There was an error while trying to delete documents (filter='${JSON.stringify(
          filter,
        )}') for collection "${collectionName}"`,
        e,
      );
      throw e;
    } finally {
      await client.close();
    }
    return false;
  },
};

export default MongoHelper;
