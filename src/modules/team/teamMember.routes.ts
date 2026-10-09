import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { TeamMember, ITeamMember } from "./teamMember.model";
import { createTeamMemberSchema, updateTeamMemberSchema } from "./teamMember.validation";

const service = createCrudService<ITeamMember>(TeamMember);
const controller = createCrudController<ITeamMember>(service, ["name", "designation"]);

export default createCrudRouter<ITeamMember>(controller, {
  resource: "team",
  createSchema: createTeamMemberSchema,
  updateSchema: updateTeamMemberSchema,
  hasSlug: false,
});
