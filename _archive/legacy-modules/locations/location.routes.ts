import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Location, ILocation } from "./location.model";
import { createLocationSchema, updateLocationSchema } from "./location.validation";

const service = createCrudService<ILocation>(Location);
const controller = createCrudController<ILocation>(service, ["name"], "locations");

// GET / supports ?type=city|country|region to power generateStaticParams on the
// frontend, and GET /slug/:slug serves a single location's page data.
export default createCrudRouter<ILocation>(controller, {
  resource: "locations",
  createSchema: createLocationSchema,
  updateSchema: updateLocationSchema,
  hasSlug: true,
});
