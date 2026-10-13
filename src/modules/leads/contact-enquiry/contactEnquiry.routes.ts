import { createLeadController, createLeadRouter, createLeadService } from "../../../common/factories/leadFactory";
import { ContactEnquiry, IContactEnquiry } from "./contactEnquiry.model";
import { createContactEnquirySchema } from "./contactEnquiry.validation";

const service = createLeadService<IContactEnquiry>(ContactEnquiry, {
  resource: "contact-enquiries",
  refPrefix: "C",
  label: "contact enquiry",
  searchableFields: ["name", "email", "company", "subject", "phone"],
  summarize: (d) => ({ name: String(d.name), email: String(d.email), headline: String(d.service ?? d.subject ?? "") }),
});
const controller = createLeadController<IContactEnquiry>(service);

export default createLeadRouter<IContactEnquiry>(controller, {
  resource: "contact-enquiries",
  refPrefix: "C",
  createSchema: createContactEnquirySchema,
});
