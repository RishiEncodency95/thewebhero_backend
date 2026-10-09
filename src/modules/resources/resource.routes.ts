import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { ResourceItem, IResourceItem } from "./resource.model";
import { createResourceSchema, updateResourceSchema } from "./resource.validation";

const service = createCrudService<IResourceItem>(ResourceItem);
const controller = createCrudController<IResourceItem>(service, ["title"]);

export default createCrudRouter<IResourceItem>(controller, {
  resource: "resources",
  createSchema: createResourceSchema,
  updateSchema: updateResourceSchema,
});
