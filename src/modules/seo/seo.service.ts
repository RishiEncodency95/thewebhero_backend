import { Model } from "mongoose";
import { ApiError } from "../../common/utils/ApiError";
import { generateSeoSuggestion } from "./seo.provider";
import { SeoSuggestion, SeoSupportedResource } from "./seo.types";

import { Blog, IBlog } from "../blog/blog.model";
import { Portfolio, IPortfolio } from "../portfolio/portfolio.model";
import { CaseStudy, ICaseStudy } from "../case-studies/caseStudy.model";
import { ServiceItem, IServiceItem } from "../services/service.model";
import { Solution, ISolution } from "../solutions/solution.model";
import { Page, IPage } from "../pages/page.model";
import { ResourceItem, IResourceItem } from "../resources/resource.model";
import { Location, ILocation } from "../locations/location.model";

type SupportedDoc = IBlog | IPortfolio | ICaseStudy | IServiceItem | ISolution | IPage | IResourceItem | ILocation;

const MODELS: Record<SeoSupportedResource, Model<SupportedDoc>> = {
  blog: Blog as unknown as Model<SupportedDoc>,
  portfolio: Portfolio as unknown as Model<SupportedDoc>,
  "case-studies": CaseStudy as unknown as Model<SupportedDoc>,
  services: ServiceItem as unknown as Model<SupportedDoc>,
  solutions: Solution as unknown as Model<SupportedDoc>,
  pages: Page as unknown as Model<SupportedDoc>,
  resources: ResourceItem as unknown as Model<SupportedDoc>,
  locations: Location as unknown as Model<SupportedDoc>,
};

// Pulls out a title + body pair to feed the AI prompt - each content type
// keeps its meaningful text in different fields.
function extractPromptText(resource: SeoSupportedResource, doc: SupportedDoc): { title: string; body: string } {
  switch (resource) {
    case "blog": {
      const d = doc as IBlog;
      return { title: d.title, body: d.excerpt || d.content || "" };
    }
    case "portfolio": {
      const d = doc as IPortfolio;
      return { title: d.title, body: d.description || "" };
    }
    case "case-studies": {
      const d = doc as ICaseStudy;
      return { title: d.title, body: [d.challenge, d.solution, d.results].filter(Boolean).join("\n") };
    }
    case "services": {
      const d = doc as IServiceItem;
      return { title: d.title, body: d.shortDescription || d.description || "" };
    }
    case "solutions": {
      const d = doc as ISolution;
      return { title: d.title, body: d.description || "" };
    }
    case "pages": {
      const d = doc as IPage;
      return { title: d.title, body: d.content || "" };
    }
    case "resources": {
      const d = doc as IResourceItem;
      return { title: d.title, body: d.description || "" };
    }
    case "locations": {
      const d = doc as ILocation;
      return {
        title: d.name,
        body: `Web development, mobile app development, and IT services for businesses in ${d.name}.`,
      };
    }
  }
}

export const seoService = {
  async generate(resource: SeoSupportedResource, id: string): Promise<SeoSuggestion> {
    const model = MODELS[resource];
    const doc = await model.findById(id);
    if (!doc) throw ApiError.notFound("Content not found");

    const { title, body } = extractPromptText(resource, doc);
    if (!title) throw ApiError.badRequest("This item has no title to generate SEO from");

    return generateSeoSuggestion(title, body);
  },
};
