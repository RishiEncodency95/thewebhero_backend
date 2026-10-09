import { createLeadController, createLeadRouter, createLeadService } from "../../../common/factories/leadFactory";
import { QuoteRequest, IQuoteRequest } from "./quoteRequest.model";
import { createQuoteRequestSchema } from "./quoteRequest.validation";

const service = createLeadService<IQuoteRequest>(QuoteRequest);
const controller = createLeadController<IQuoteRequest>(service);

export default createLeadRouter<IQuoteRequest>(controller, {
  resource: "quote-requests",
  createSchema: createQuoteRequestSchema,
});
