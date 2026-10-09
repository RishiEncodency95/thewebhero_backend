import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Page, IPage } from "./page.model";
import { createPageSchema, updatePageSchema } from "./page.validation";

const service = createCrudService<IPage>(Page);
const controller = createCrudController<IPage>(service, ["title"]);

export default createCrudRouter<IPage>(controller, {
  resource: "pages",
  createSchema: createPageSchema,
  updateSchema: updatePageSchema,
  publicRead: true,
  hasSlug: true,
});
