import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Technology, ITechnology } from "./technology.model";
import { createTechnologySchema, updateTechnologySchema } from "./technology.validation";

const service = createCrudService<ITechnology>(Technology);
const controller = createCrudController<ITechnology>(service, ["name"]);

export default createCrudRouter<ITechnology>(controller, {
  resource: "technologies",
  createSchema: createTechnologySchema,
  updateSchema: updateTechnologySchema,
});
