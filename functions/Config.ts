import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Configuration } from "../ApiTypes";
import { createConfig, deleteConfig, getConfigById, getConfigs, updateConfig } from "../business/ConfigBusiness";
import logger from "../helpers/Logger";

export async function Config(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  logger.init(context, `${request.method} / ${request.url}`);
  const headers = {
    "Access-Control-Allow-Origin": "*", // Ou spécifiez l'origine exacte de votre application admin
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (request.method === "OPTIONS") {
    return { status: 204, headers };
  }
  switch (request.method) {
    case "GET": {
      const configs = await getConfigs();
      const id = request.query.get("id");

      if (configs.length === 0) {
        logger.warn("No configurations found");
      }
      return id
        ? { jsonBody: await getConfigById(id), headers }
        : {
            jsonBody: configs,
            headers,
          };
    }

    case "POST": {
      const body = (await request.json()) as Configuration;
      const configs = await createConfig(body);
      logger.info("Returning configurations ", { configs });
      return { jsonBody: configs };
    }
    case "PUT": {
      const body = (await request.json()) as Configuration;
      const configs = await updateConfig(body as Configuration);
      logger.info("Returning configurations ", { configs });
      return { jsonBody: configs };
    }
    case "DELETE": {
      logger.info("Deleting configuration🔔");
      const id = request.query.get("id");
      const configs = await deleteConfig(id);
      logger.info("Returning configurations ", { configs });
      return { jsonBody: configs };
    }
    default:
      return { status: 405 };
  }
}

app.http("Config", {
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: Config,
});
