import { createLeadController, createLeadRouter, createLeadService } from "../../../common/factories/leadFactory";
import { QuoteRequest, IQuoteRequest } from "./quoteRequest.model";
import { createQuoteRequestSchema } from "./quoteRequest.validation";

const service = createLeadService<IQuoteRequest>(QuoteRequest, {
  resource: "quote-requests",
  refPrefix: "Q",
  label: "quote request",
  searchableFields: ["fullName", "email", "companyName", "service", "phone"],
  summarize: (d) => ({ name: String(d.fullName), email: String(d.email), headline: String(d.service ?? "") }),
});
const controller = createLeadController<IQuoteRequest>(service);

export default createLeadRouter<IQuoteRequest>(controller, {
  resource: "quote-requests",
  refPrefix: "Q",
  createSchema: createQuoteRequestSchema,
});
