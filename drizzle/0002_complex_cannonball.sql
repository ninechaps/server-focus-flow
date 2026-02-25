CREATE TABLE "api_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"path" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"client_source" varchar(50) DEFAULT 'unknown' NOT NULL,
	"status_code" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_verification_codes" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_verification_codes" ALTER COLUMN "used_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_verification_codes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_verification_codes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "revoked_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sync_data" ALTER COLUMN "synced_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sync_data" ALTER COLUMN "synced_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "login_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "login_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "last_active_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "last_active_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "logout_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_login_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "client_source" varchar(50) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "user_type" varchar(20) DEFAULT 'client' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "client_login_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "api_access_logs" ADD CONSTRAINT "api_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_access_logs_created_at" ON "api_access_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_api_access_logs_user_id" ON "api_access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_access_logs_client_source" ON "api_access_logs" USING btree ("client_source");