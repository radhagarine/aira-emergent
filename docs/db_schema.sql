-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.User (
  id uuid NOT NULL DEFAULT auth.uid(),
  email text NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  full_name text,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.appointments_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::appointment_status,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  business_id uuid NOT NULL,
  party_size smallint,
  customer_name character varying CHECK (length(customer_name::text) >= 2),
  customer_phone character varying CHECK (length(customer_phone::text) >= 10),
  customer_email character varying,
  booking_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  booking_source character varying DEFAULT 'voice_bot'::character varying,
  confirmation_code character varying UNIQUE,
  google_calendar_event_id character varying,
  external_booking_id character varying,
  cancelled_at timestamp with time zone,
  CONSTRAINT appointments_v2_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_v2_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT appointments_v2_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.business_booking_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  business_type USER-DEFINED NOT NULL,
  default_duration_minutes integer DEFAULT 60,
  slot_interval_minutes integer DEFAULT 15,
  max_advance_days integer DEFAULT 30,
  min_advance_hours integer DEFAULT 2,
  max_concurrent_bookings integer DEFAULT 1,
  allow_overbooking boolean DEFAULT false,
  overbooking_percentage integer DEFAULT 0,
  buffer_before_minutes integer DEFAULT 0,
  buffer_after_minutes integer DEFAULT 0,
  require_phone boolean DEFAULT true,
  require_email boolean DEFAULT false,
  auto_confirm boolean DEFAULT true,
  allow_cancellation boolean DEFAULT true,
  cancellation_deadline_hours integer DEFAULT 24,
  google_calendar_id character varying,
  sync_to_google_calendar boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_booking_config_pkey PRIMARY KEY (id),
  CONSTRAINT business_booking_config_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.business_files_v2 (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  file_type text NOT NULL,
  original_name text NOT NULL,
  storage_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT business_files_v2_pkey PRIMARY KEY (id),
  CONSTRAINT business_files_v2_business_id_fkey1 FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.business_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time without time zone NOT NULL,
  close_time time without time zone NOT NULL,
  is_closed boolean DEFAULT false,
  service_type character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_hours_pkey PRIMARY KEY (id),
  CONSTRAINT business_hours_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.business_numbers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  phone_number text NOT NULL UNIQUE,
  display_name text NOT NULL,
  country_code text NOT NULL,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  number_type USER-DEFINED NOT NULL,
  provider text,
  purchase_date timestamp with time zone,
  monthly_cost numeric,
  features jsonb DEFAULT '[]'::jsonb,
  notes text,
  twilio_sid text UNIQUE,
  twilio_account_sid text,
  voice_url text,
  sms_url text,
  status_callback_url text,
  capabilities jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT business_numbers_pkey PRIMARY KEY (id),
  CONSTRAINT business_numbers_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.business_special_dates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  date date NOT NULL,
  is_closed boolean DEFAULT false,
  open_time time without time zone,
  close_time time without time zone,
  reason character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_special_dates_pkey PRIMARY KEY (id),
  CONSTRAINT business_special_dates_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.business_v2 (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  address text,
  phone text UNIQUE,
  email text,
  profile_image text,
  CONSTRAINT business_v2_pkey PRIMARY KEY (id),
  CONSTRAINT business_original_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.restaurant_details_v2 (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  menu_items text,
  seating_capacity integer,
  cuisine_type text,
  operating_hours text,
  delivery_available boolean DEFAULT false,
  takeout_available boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agent_instructions text,
  ai_communication_style text,
  greeting_message text,
  special_instructions text,
  CONSTRAINT restaurant_details_v2_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_details_v2_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.retail_details_v2 (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  store_type text,
  inventory_size integer,
  has_online_store boolean DEFAULT false,
  operating_hours text,
  delivery_available boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agent_instructions text,
  ai_communication_style text,
  greeting_message text,
  special_instructions text,
  CONSTRAINT retail_details_v2_pkey PRIMARY KEY (id),
  CONSTRAINT retail_details_v2_business_id_fkey1 FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.service_details_v2 (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  service_type text,
  service_area text,
  is_mobile_service boolean DEFAULT false,
  requires_booking boolean DEFAULT false,
  operating_hours text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  agent_instructions text,
  ai_communication_style text,
  greeting_message text,
  special_instructions text,
  CONSTRAINT service_details_v2_pkey PRIMARY KEY (id),
  CONSTRAINT service_details_v2_business_id_fkey1 FOREIGN KEY (business_id) REFERENCES public.business_v2(id)
);
CREATE TABLE public.url (
  decrypted_secret text
);