import { Router } from "express";

import authRoutes from "../../modules/auth/auth.routes";
import userRoutes from "../../modules/users/user.routes";
import roleRoutes from "../../modules/roles/role.routes";
import auditLogRoutes from "../../modules/audit-logs/auditLog.routes";
import mediaRoutes from "../../modules/media/media.routes";
import notificationRoutes from "../../modules/notifications/notification.routes";
import contactEnquiryRoutes from "../../modules/leads/contact-enquiry/contactEnquiry.routes";
import quoteRequestRoutes from "../../modules/leads/quote-request/quoteRequest.routes";
import supportRequestRoutes from "../../modules/leads/support-request/supportRequest.routes";
import newsletterRoutes from "../../modules/newsletter/newsletter.routes";
import seoRoutes from "../../modules/seo/seo.routes";

import { contentTypesRouter, sitemapRouter } from "../../cms/router";
import { services, solutions, technologies, industries, categories, businessNeeds } from "../../content/offerings";
import { portfolio, blog, team, careers, testimonials, faqs, locations } from "../../content/editorial";
import { seoPages, settings, company, homePage } from "../../content/site";

const router = Router();

// ── System ────────────────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/audit-logs", auditLogRoutes);
router.use("/media", mediaRoutes);
router.use("/notifications", notificationRoutes);

// ── CMS ───────────────────────────────────────────────────────────────────
router.use("/content-types", contentTypesRouter);
router.use("/sitemap", sitemapRouter);
router.use("/seo", seoRoutes);
router.use("/seo-pages", seoPages.router);
router.use("/settings", settings.router);
router.use("/company", company.router);
router.use("/home-page", homePage.router);

router.use("/services", services.router);
router.use("/solutions", solutions.router);
router.use("/technologies", technologies.router);
router.use("/industries", industries.router);
router.use("/categories", categories.router);
router.use("/business-needs", businessNeeds.router);
router.use("/portfolio", portfolio.router);
router.use("/blog", blog.router);
router.use("/team", team.router);
router.use("/careers", careers.router);
router.use("/testimonials", testimonials.router);
router.use("/faqs", faqs.router);
router.use("/locations", locations.router);

// ── Leads ─────────────────────────────────────────────────────────────────
router.use("/contact-enquiries", contactEnquiryRoutes);
router.use("/quote-requests", quoteRequestRoutes);
router.use("/support-requests", supportRequestRoutes);
router.use("/newsletter", newsletterRoutes);

export default router;
