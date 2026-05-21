CREATE TABLE "lookup_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"namespace" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"action" text NOT NULL,
	"actor" text DEFAULT 'local-user' NOT NULL,
	"before" text,
	"after" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "income_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"date_received" date NOT NULL,
	"income_source_id" integer,
	"source_name" text NOT NULL,
	"person" text,
	"gross_amount" numeric(12, 2) NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"payment_method" text,
	"tags" text,
	"notes" text,
	"allocated" boolean DEFAULT false NOT NULL,
	"gig_entry_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" text NOT NULL,
	"due_day" integer,
	"due_date" date,
	"account_ref" text,
	"autopay" boolean DEFAULT false NOT NULL,
	"notes" text,
	"paid_status" text DEFAULT 'unpaid' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arrears_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"creditor" text NOT NULL,
	"category" text NOT NULL,
	"balance" numeric(12, 2) NOT NULL,
	"ongoing_charge" numeric(12, 2) NOT NULL,
	"ongoing_frequency" text NOT NULL,
	"arrears_payment" numeric(12, 2) NOT NULL,
	"arrears_frequency" text NOT NULL,
	"risk_level" text NOT NULL,
	"status" text NOT NULL,
	"next_review_date" date,
	"account_ref" text,
	"summary" text,
	"objective" text,
	"working_plan" text,
	"communication_position" text,
	"external_acknowledgement" text,
	"external_payment_intent" text,
	"external_staged_reduction" text,
	"external_review_points" text,
	"external_channel" text,
	"evidence_links" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"bucket" text NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"due_date" date,
	"start_date" date,
	"assigned_person" text,
	"creditor_tag" text,
	"arrears_item_id" integer,
	"recurring" text DEFAULT 'false' NOT NULL,
	"completed_at" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comms_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"channel" text NOT NULL,
	"creditor" text NOT NULL,
	"arrears_item_id" integer,
	"who" text,
	"outcome" text NOT NULL,
	"next_step" text
);
--> statement-breakpoint
CREATE TABLE "weekly_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_start" date NOT NULL,
	"planned_in" numeric(12, 2) NOT NULL,
	"actual_in" numeric(12, 2) NOT NULL,
	"planned_out" numeric(12, 2) NOT NULL,
	"actual_out" numeric(12, 2) NOT NULL,
	"notes" text,
	CONSTRAINT "weekly_entries_week_start_unique" UNIQUE("week_start")
);
--> statement-breakpoint
CREATE TABLE "gig_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_date" date NOT NULL,
	"platform" text DEFAULT 'doordash' NOT NULL,
	"person" text,
	"start_time" text,
	"end_time" text,
	"hours_worked" numeric(5, 2),
	"gross_earnings" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tips" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fast_pay_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"weekly_deposit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fees" numeric(10, 2) DEFAULT '0' NOT NULL,
	"fuel_estimate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"other_expenses" numeric(10, 2) DEFAULT '0' NOT NULL,
	"net_income" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"income_entry_id" integer,
	"notes" text,
	"estimated_km" numeric(8, 3),
	"active_minutes" integer,
	"deliveries_count" integer,
	"offers_count" integer,
	"route_chain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"group" text DEFAULT 'other' NOT NULL,
	"planned_weekly" numeric(10, 2) DEFAULT '0' NOT NULL,
	"actual_weekly" numeric(10, 2) DEFAULT '0' NOT NULL,
	"essential" boolean DEFAULT true NOT NULL,
	"include_in_scenario" boolean DEFAULT true NOT NULL,
	"carry_forward" boolean DEFAULT false NOT NULL,
	"notes" text,
	"color" text,
	"sort_order" serial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"label" text DEFAULT 'base' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_date" date,
	"end_date" date,
	"income_assumptions" text,
	"bill_assumptions" text,
	"arrears_assumptions" text,
	"spending_changes" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"item" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"quantity_size" text,
	"preferred_store" text DEFAULT 'any' NOT NULL,
	"alternative_store" text,
	"alternative_item" text,
	"estimated_price" numeric(8, 2),
	"actual_price" numeric(8, 2),
	"priority" text DEFAULT 'normal' NOT NULL,
	"usual_frequency" text DEFAULT 'weekly' NOT NULL,
	"last_purchased_date" date,
	"linked_budget_category_id" integer,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"week_start" date,
	"week_end" date,
	"status" text DEFAULT 'draft' NOT NULL,
	"estimated_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"actual_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_list_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopping_list_id" integer NOT NULL,
	"shopping_item_id" integer,
	"item" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"quantity_size" text,
	"store" text,
	"estimated_price" numeric(8, 2),
	"actual_price" numeric(8, 2),
	"needed" boolean DEFAULT true NOT NULL,
	"bought" boolean DEFAULT false NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bnpl_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"description" text NOT NULL,
	"original_amount" numeric(12, 2) NOT NULL,
	"remaining_balance" numeric(12, 2) NOT NULL,
	"instalment_amount" numeric(12, 2) NOT NULL,
	"instalment_frequency" text DEFAULT 'fortnightly' NOT NULL,
	"next_payment_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"fee_risk" text,
	"linked_budget_category" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "bnpl_schedule_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"bnpl_item_id" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"paid_date" date,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stored_value_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"starting_value" numeric(12, 2) NOT NULL,
	"remaining_balance" numeric(12, 2) NOT NULL,
	"purchase_date" date,
	"expiry_date" date,
	"linked_budget_category" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stored_value_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"stored_value_item_id" integer NOT NULL,
	"transaction_date" date NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "gig_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_name" text NOT NULL,
	"provider_type" text DEFAULT 'delivery' NOT NULL,
	"status" text DEFAULT 'Interested' NOT NULL,
	"payment_frequency" text,
	"expected_payment_day" text,
	"expected_weekly_income" numeric(10, 2),
	"tax_set_aside_pct" numeric(5, 2) DEFAULT '0',
	"vehicle_cost_method" text DEFAULT 'fuel_estimate',
	"uses_location_tracking" boolean DEFAULT false NOT NULL,
	"uses_shift_tracking" boolean DEFAULT false NOT NULL,
	"uses_journey_tracking" boolean DEFAULT false NOT NULL,
	"feeds_myoh_budget" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roadmap_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"layer" text NOT NULL,
	"status" text NOT NULL,
	"description" text NOT NULL,
	"why_it_matters" text NOT NULL,
	"validation_needed" text,
	"risk_notes" text,
	"build_priority" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bnpl_schedule_entries" ADD CONSTRAINT "bnpl_schedule_entries_bnpl_item_id_bnpl_items_id_fk" FOREIGN KEY ("bnpl_item_id") REFERENCES "public"."bnpl_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stored_value_transactions" ADD CONSTRAINT "stored_value_transactions_stored_value_item_id_stored_value_items_id_fk" FOREIGN KEY ("stored_value_item_id") REFERENCES "public"."stored_value_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_lookup_namespace_value" ON "lookup_values" USING btree ("namespace","value");