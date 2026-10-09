import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Partner, IPartner } from "./partner.model";
import { createPartnerSchema, updatePartnerSchema } from "./partner.validation";

const service = createCrudService<IPartner>(Partner);
const controller = createCrudController<IPartner>(service, ["name"]);

export default createCrudRouter<IPartner>(controller, {
  resource: "partners",
  createSchema: createPartnerSchema,
  updateSchema: updatePartnerSchema,
  hasSlug: false,
});
