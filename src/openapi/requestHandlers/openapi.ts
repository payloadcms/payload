import { Response, NextFunction } from "express";
import httpStatus from "http-status";
import { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { PayloadRequest } from "../../express/types";
import openapiOperation from "../operations/openapi";

export default async function openapiRequestHandler(
  req: PayloadRequest,
  res: Response,
  next: NextFunction
): Promise<Response<OpenAPIV3.Document | OpenAPIV3_1.Document> | void> {
  try {
    const accessResults = await openapiOperation({
      req,
    });

    return res.status(httpStatus.OK).json(accessResults);
  } catch (error) {
    return next(error);
  }
}
