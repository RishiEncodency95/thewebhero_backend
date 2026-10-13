import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Solution, ISolution } from "./solution.model";
import { createSolutionSchema, updateSolutionSchema } from "./solution.validation";

const service = createCrudService<ISolution>(Solution);
const controller = createCrudController<ISolution>(service, ["title"], "solutions");

export default createCrudRouter<ISolution>(controller, {
  resource: "solutions",
  createSchema: createSolutionSchema,
  updateSchema: updateSolutionSchema,
});
