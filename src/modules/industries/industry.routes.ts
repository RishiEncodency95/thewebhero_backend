import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Industry, IIndustry } from "./industry.model";
import { createIndustrySchema, updateIndustrySchema } from "./industry.validation";

const service = createCrudService<IIndustry>(Industry);
const controller = createCrudController<IIndustry>(service, ["name"]);

export default createCrudRouter<IIndustry>(controller, {
  resource: "industries",
  createSchema: createIndustrySchema,
  updateSchema: updateIndustrySchema,
});
