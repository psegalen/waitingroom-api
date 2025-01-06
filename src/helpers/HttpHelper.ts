import { HttpResponseInit } from "@azure/functions";

const invalidParameters = { status: 400, body: "Invalid parameters" };
const notFound = { status: 404, body: "Not found" };

export default {
  invalidParameters,
  unauthorized: { status: 401, body: "Unauthorized" },
  methodNotAllowed: { status: 405, body: "Method not allowed" },
  internalServerError: { status: 500, body: "Something went wrong" },
  resultOrInvalidParameters: (result: unknown): HttpResponseInit => (result ? { jsonBody: result } : invalidParameters),
  resultOrNotFound: (result: unknown): HttpResponseInit => (result ? { jsonBody: result } : notFound),
};
