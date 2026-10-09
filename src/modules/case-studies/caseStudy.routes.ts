import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { CaseStudy, ICaseStudy } from "./caseStudy.model";
import { createCaseStudySchema, updateCaseStudySchema } from "./caseStudy.validation";

const service = createCrudService<ICaseStudy>(CaseStudy);
const controller = createCrudController<ICaseStudy>(service, ["title", "client", "industry"]);

export default createCrudRouter<ICaseStudy>(controller, {
  resource: "case-studies",
  createSchema: createCaseStudySchema,
  updateSchema: updateCaseStudySchema,
});
