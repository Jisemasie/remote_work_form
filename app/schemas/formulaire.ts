import { z } from "zod";

export const FormulaireSchema = z.object({
  id: z.number(),
  request_no: z.string().max(30),
  branch: z.string().max(50),
  departement: z.string().max(50).nullable(),
  create_dt: z.union([z.date(), z.string()]).optional(),
  update_dt: z.union([z.date(), z.string()]).optional(),
  request_dt: z.union([z.date(), z.string()]),
  request_priority: z.enum(["ordinaire", "urgent"]),
  delivery_address: z.string().max(255).default("FINCA CONGO SPRL"),
  expected_delivery_dt: z.union([z.date(), z.string()]).nullable(),
  expected_delivery_mode: z.enum(["Air", "Mer", "Route", "Main", "Other"]),
  other_expected_delivery_mode: z.string().max(100).nullable(),
  contact_person: z.string().max(50).nullable(),
  requisition_purpose: z.enum(["Estimation", "Achat(BDC)", "Service"]),
  currency: z.enum(["USD", "CDF"]),
  head_of_department: z.string().max(50).nullable(),
  dpt_approval_dt: z.union([z.date(), z.string()]).nullable(),
  admin_staff: z.string().max(50).nullable(),
  admin_approval_dt:  z.union([z.date(), z.string()]).nullable(),
  budget_management_staff: z.string().max(50).nullable(),
  budget_approval_dt: z.union([z.date(), z.string()]).nullable(),
  status: z.string().max(50).nullable(),
  created_by: z.number(),
  requested_by: z.string(),
  version: z.string()
});

export const RequisitionItemSchema = z.object({
    id_requisition: z.number(),
    description: z.string().max(255),
    quantity: z.number().int().positive(),
    unit_price: z.number().nonnegative(), // Money type -> number
    total_cost: z.number().nonnegative(), // Money type -> number
    no_bc: z.string().max(30).nullable(),
    created_by: z.number(),
    create_dt: z.date().optional(),
    update_dt: z.date().optional(),
    version: z.string()
  });
  