import { createCrudController, createCrudRouter, createCrudService } from "../../common/factories/crudFactory";
import { Blog, IBlog } from "./blog.model";
import { createBlogSchema, updateBlogSchema } from "./blog.validation";

const service = createCrudService<IBlog>(Blog);
const controller = createCrudController<IBlog>(service, ["title", "category"], "blog");

export default createCrudRouter<IBlog>(controller, {
  resource: "blog",
  createSchema: createBlogSchema,
  updateSchema: updateBlogSchema,
});
