-- Create the business_profiles table
create table if not exists business_profiles (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    business_name text,
    address text,
    phone text,
    email text,
    industry text,
    profile_image text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table business_profiles enable row level security;

-- RLS Policies for business_profiles
create policy "Users can view their own profile"
    on business_profiles
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own profile"
    on business_profiles
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own profile"
    on business_profiles
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own profile"
    on business_profiles
    for delete
    using (auth.uid() = user_id);

-- Create storage bucket for business profiles
insert into storage.buckets (id, name)
values ('business-profiles', 'business-profiles')
on conflict do nothing;

-- Storage policies for business-profiles bucket
create policy "Authenticated users can upload files"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'business-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Users can update their own files"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'business-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Public can view files"
    on storage.objects for select
    to public
    using (bucket_id = 'business-profiles');

create policy "Users can delete their own files"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'business-profiles' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to upload files
create policy "Allow authenticated uploads"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'business-profiles' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own files
create policy "Allow authenticated updates"
on storage.objects
for update to authenticated
using (
  bucket_id = 'business-profiles' AND
  auth.uid() = owner
);

-- Allow public read access
create policy "Allow public read"
on storage.objects
for select to public
using (bucket_id = 'business-profiles');

------
-- First create an enum for appointment status
CREATE TYPE appointment_status AS ENUM (
    'pending',      -- Initial state when appointment is requested
    'confirmed',    -- After confirmation/approval
    'cancelled',    -- If cancelled by user or service provider
    'completed',    -- After the appointment is done
    'no_show'       -- If the client didn't show up
);

CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    google_event_id TEXT NOT NULL,
    service_type TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on user_id for faster lookups
CREATE INDEX idx_appointments_user_id ON appointments(user_id);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policy
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own appointments
CREATE POLICY "Users can view their own appointments"
    ON appointments FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to create their own appointments
CREATE POLICY "Users can create their own appointments"
    ON appointments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own appointments
CREATE POLICY "Users can update their own appointments"
    ON appointments FOR UPDATE
    USING (auth.uid() = user_id);

-- Add business_id to appointments table
ALTER TABLE appointments 
ADD COLUMN business_id UUID REFERENCES business_profiles(id) NOT NULL;


-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main business table
/* CREATE TABLE business (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,                           -- Business name (e.g., "Fork & Folly")
  business_type TEXT NOT NULL,
  menu_items TEXT,
  seating_capacity INTEGER,
  agent_instructions TEXT,
  
  -- Customer Interaction fields
  ai_communication_style TEXT,                  -- e.g., "Casual", "Professional", etc.
  greeting_message TEXT,
  special_instructions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
); */
CREATE TABLE business (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  business_type business_type, -- ENUM type
  agent_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table for tracking business files (both knowledge base and CSV configurations)
CREATE TABLE business_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,                      -- 'knowledge_base' or 'csv_config'
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,                   -- Path in storage bucket
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',                  -- For any additional file metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies for business table
ALTER TABLE business ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business"
ON business FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business"
ON business FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business"
ON business FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business"
ON business FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for business_files table
ALTER TABLE business_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files of their business"
ON business_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business 
    WHERE business.id = business_files.business_id 
    AND business.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert files to their business"
ON business_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM business 
    WHERE business.id = business_files.business_id 
    AND business.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update files of their business"
ON business_files FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business 
    WHERE business.id = business_files.business_id 
    AND business.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete files of their business"
ON business_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM business 
    WHERE business.id = business_files.business_id 
    AND business.user_id = auth.uid()
  )
);

-- Storage bucket configuration
INSERT INTO storage.buckets (id, name, public) VALUES 
('business-files', 'business-files', false);

-- Storage bucket RLS policies
CREATE POLICY "Users can view their own business files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-files' AND 
  (EXISTS (
    SELECT 1 FROM business_files 
    JOIN business ON business.id = business_files.business_id
    WHERE business.user_id = auth.uid()
    AND storage_path = name
  ))
);

CREATE POLICY "Users can upload their own business files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-files' AND 
  (EXISTS (
    SELECT 1 FROM business
    WHERE business.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their own business files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-files' AND 
  (EXISTS (
    SELECT 1 FROM business_files 
    JOIN business ON business.id = business_files.business_id
    WHERE business.user_id = auth.uid()
    AND storage_path = name
  ))
);

CREATE POLICY "Users can delete their own business files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-files' AND 
  (EXISTS (
    SELECT 1 FROM business_files 
    JOIN business ON business.id = business_files.business_id
    WHERE business.user_id = auth.uid()
    AND storage_path = name
  ))
);

-- Updated trigger for business table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_updated_at
    BEFORE UPDATE ON business
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for business_files table
CREATE TRIGGER update_business_files_updated_at
    BEFORE UPDATE ON business_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create enum for business types
CREATE TYPE business_type AS ENUM ('restaurant', 'retail', 'service');

-- Create type-specific detail tables
CREATE TABLE restaurant_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    menu_items TEXT,
    seating_capacity INTEGER,
    cuisine_type TEXT,
    operating_hours JSONB,          -- Store hours for each day
    delivery_available BOOLEAN DEFAULT false,
    takeout_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE retail_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    store_type TEXT,               -- e.g., clothing, electronics, grocery
    inventory_size INTEGER,
    has_online_store BOOLEAN DEFAULT false,
    operating_hours JSONB,
    delivery_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE service_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
    service_type TEXT,             -- e.g., consulting, healthcare, education
    service_area TEXT,             -- geographical service area
    is_mobile_service BOOLEAN DEFAULT false,
    requires_booking BOOLEAN DEFAULT false,
    operating_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Modify the main business table to use the enum
ALTER TABLE business ALTER COLUMN business_type TYPE business_type USING business_type::business_type;

-- Add RLS policies for restaurant_details
ALTER TABLE restaurant_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their restaurant details"
ON restaurant_details
USING (
    EXISTS (
        SELECT 1 FROM business 
        WHERE business.id = restaurant_details.business_id 
        AND business.user_id = auth.uid()
    )
);

-- Add RLS policies for retail_details
ALTER TABLE retail_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their retail details"
ON retail_details
USING (
    EXISTS (
        SELECT 1 FROM business 
        WHERE business.id = retail_details.business_id 
        AND business.user_id = auth.uid()
    )
);

-- Add RLS policies for service_details
ALTER TABLE service_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their service details"
ON service_details
USING (
    EXISTS (
        SELECT 1 FROM business 
        WHERE business.id = service_details.business_id 
        AND business.user_id = auth.uid()
    )
);

-- Add triggers for updated_at
CREATE TRIGGER update_restaurant_details_updated_at
    BEFORE UPDATE ON restaurant_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retail_details_updated_at
    BEFORE UPDATE ON retail_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_details_updated_at
    BEFORE UPDATE ON service_details
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

