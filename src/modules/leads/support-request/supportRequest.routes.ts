import { createLeadController, createLeadRouter, createLeadService } from "../../../common/factories/leadFactory";
import { SupportRequest, ISupportRequest } from "./supportRequest.model";
import { createSupportRequestSchema } from "./supportRequest.validation";

const service = createLeadService<ISupportRequest>(SupportRequest);
const controller = createLeadController<ISupportRequest>(service);

export default createLeadRouter<ISupportRequest>(controller, {
  resource: "support-requests",
  createSchema: createSupportRequestSchema,
});
