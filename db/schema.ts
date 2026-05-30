import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "reader"]);
export const itemTypeEnum = pgEnum("item_type", ["link", "file"]);
export const memberRoleEnum = pgEnum("member_role", ["manager", "reader"]);

// How a folder presents its items: "cards" (loose links/files) or
// "register" (structured deliverables table — see PRODUCT.md).
export const folderViewTypeEnum = pgEnum("folder_view_type", [
  "cards",
  "register",
]);

// Folder colors
export const folderColorEnum = pgEnum("folder_color", [
  "slate",
  "indigo",
  "violet",
  "rose",
  "amber",
  "emerald",
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("reader"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companies = pgTable("companies", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
});

export const companyMembers = pgTable(
  "company_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
  },
  (t) => [index("cm_company_user_idx").on(t.companyId, t.userId)]
);

export const folders = pgTable(
  "folders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    color: folderColorEnum("color").notNull().default("slate"),
    viewType: folderViewTypeEnum("view_type").notNull().default("cards"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("folders_company_idx").on(t.companyId)]
);

export const items = pgTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: varchar("title", { length: 500 }).notNull(),
    description: varchar("description", { length: 500 }),
    type: itemTypeEnum("type").notNull(),
    url: text("url"),
    fileKey: text("file_key"),
    fileName: varchar("file_name", { length: 500 }),
    fileSize: integer("file_size"),
    folderId: text("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    tags: text("tags").array().notNull().default([]),
    notes: text("notes"),
    itemDate: timestamp("item_date").notNull().defaultNow(),
    isPinned: boolean("is_pinned").notNull().default(false),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("items_company_idx").on(t.companyId),
    index("items_folder_idx").on(t.folderId),
    index("items_url_company_idx").on(t.url, t.companyId),
  ]
);

export const clientShares = pgTable(
  "client_shares",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    label: varchar("label", { length: 255 }),
    clientEmail: varchar("client_email", { length: 255 }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    lastAccessedAt: timestamp("last_accessed_at"),
  },
  (t) => [
    index("client_shares_token_idx").on(t.token),
    index("client_shares_company_idx").on(t.companyId),
  ]
);

export const itemHistory = pgTable("item_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  updateNote: text("update_note").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  companyMembers: many(companyMembers),
  createdCompanies: many(companies),
  createdFolders: many(folders),
  createdItems: many(items),
}));

export const companiesRelations = relations(companies, ({ many, one }) => ({
  members: many(companyMembers),
  folders: many(folders),
  items: many(items),
  createdBy: one(users, { fields: [companies.createdBy], references: [users.id] }),
}));

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, { fields: [companyMembers.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyMembers.userId], references: [users.id] }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  company: one(companies, { fields: [folders.companyId], references: [companies.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  children: many(folders),
  items: many(items),
  createdBy: one(users, { fields: [folders.createdBy], references: [users.id] }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  folder: one(folders, { fields: [items.folderId], references: [folders.id] }),
  company: one(companies, { fields: [items.companyId], references: [companies.id] }),
  history: many(itemHistory),
  createdBy: one(users, { fields: [items.createdBy], references: [users.id] }),
}));

export const itemHistoryRelations = relations(itemHistory, ({ one }) => ({
  item: one(items, { fields: [itemHistory.itemId], references: [items.id] }),
  createdBy: one(users, { fields: [itemHistory.createdBy], references: [users.id] }),
}));

export const clientSharesRelations = relations(clientShares, ({ one }) => ({
  company: one(companies, {
    fields: [clientShares.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [clientShares.createdBy],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type CompanyMember = typeof companyMembers.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Item = typeof items.$inferSelect;
export type ItemHistory = typeof itemHistory.$inferSelect;
export type ClientShare = typeof clientShares.$inferSelect;
