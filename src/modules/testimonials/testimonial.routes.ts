import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Testimonial, ITestimonial } from "./testimonial.model";
import { createTestimonialSchema, updateTestimonialSchema } from "./testimonial.validation";

const service = createCrudService<ITestimonial>(Testimonial);
const controller = createCrudController<ITestimonial>(service, ["clientName", "clientCompany"]);

export default createCrudRouter<ITestimonial>(controller, {
  resource: "testimonials",
  createSchema: createTestimonialSchema,
  updateSchema: updateTestimonialSchema,
  hasSlug: false,
});
