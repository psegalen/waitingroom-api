/* eslint-disable @typescript-eslint/no-unused-vars */

export interface MongoDocument {
  _id?: string;
  id: string;
  active?: boolean;
  creationDate?: number;
  latestUpdate?: number;
}

export const stripExtraFields = (
  doc: MongoDocument,
  keepOnlyLatestUpdate = false,
  keepOnlyCreationDate = false,
): MongoDocument => {
  if (typeof doc === "undefined") return undefined;
  if (keepOnlyCreationDate) {
    const { _id, latestUpdate, ...rest } = doc;
    return rest;
  } else if (keepOnlyLatestUpdate) {
    const { _id, creationDate, ...rest } = doc;
    return rest;
  } else {
    const { _id, creationDate, latestUpdate, ...rest } = doc;
    return rest;
  }
};

export const isStringEmpty = (s?: string): boolean => (s?.length || 0) === 0;

export interface Configuration {
  id: string;
  cabinet: string;
  heartbeat: number;
  screens: Screen[];
  messages: Message[];
}

export interface Screen {
  id: string;
  numCode?: number;
  name?: string;
}

export interface Message {
  id: string;
  text?: string;
  picture?: string;
}
