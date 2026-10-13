import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Award, IAward } from "./award.model";
import { createAwardSchema, updateAwardSchema } from "./award.validation";

const service = createCrudService<IAward>(Award);
const controller = createCrudController<IAward>(service, ["title", "organization"], "awards");

export default createCrudRouter<IAward>(controller, {
  resource: "awards",
  createSchema: createAwardSchema,
  updateSchema: updateAwardSchema,
  hasSlug: false,
});
