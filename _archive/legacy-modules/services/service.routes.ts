import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { ServiceItem, IServiceItem } from "./service.model";
import { createServiceSchema, updateServiceSchema } from "./service.validation";

const service = createCrudService<IServiceItem>(ServiceItem);
const controller = createCrudController<IServiceItem>(service, ["title"], "services");

export default createCrudRouter<IServiceItem>(controller, {
  resource: "services",
  createSchema: createServiceSchema,
  updateSchema: updateServiceSchema,
});
