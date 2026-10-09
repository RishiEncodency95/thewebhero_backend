import { createLeadController, createLeadRouter, createLeadService } from "../../../common/factories/leadFactory";
import { ContactEnquiry, IContactEnquiry } from "./contactEnquiry.model";
import { createContactEnquirySchema } from "./contactEnquiry.validation";

const service = createLeadService<IContactEnquiry>(ContactEnquiry);
const controller = createLeadController<IContactEnquiry>(service);

export default createLeadRouter<IContactEnquiry>(controller, {
  resource: "contact-enquiries",
  createSchema: createContactEnquirySchema,
});
