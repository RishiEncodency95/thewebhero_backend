import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Faq, IFaq } from "./faq.model";
import { createFaqSchema, updateFaqSchema } from "./faq.validation";

const service = createCrudService<IFaq>(Faq);
const controller = createCrudController<IFaq>(service, ["question", "category"], "faqs");

export default createCrudRouter<IFaq>(controller, {
  resource: "faqs",
  createSchema: createFaqSchema,
  updateSchema: updateFaqSchema,
  hasSlug: false,
});
