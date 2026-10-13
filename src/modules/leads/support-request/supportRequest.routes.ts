import { createLeadController, createLeadRouter, createLeadService } from "../../../common/factories/leadFactory";
import { SupportRequest, ISupportRequest } from "./supportRequest.model";
import { createSupportRequestSchema } from "./supportRequest.validation";

const service = createLeadService<ISupportRequest>(SupportRequest, {
  resource: "support-requests",
  refPrefix: "S",
  label: "support request",
  searchableFields: ["name", "email", "subject", "phone"],
  summarize: (d) => ({ name: String(d.name), email: String(d.email), headline: String(d.subject ?? "") }),
});
const controller = createLeadController<ISupportRequest>(service);

export default createLeadRouter<ISupportRequest>(controller, {
  resource: "support-requests",
  refPrefix: "S",
  createSchema: createSupportRequestSchema,
});
