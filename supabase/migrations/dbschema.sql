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

CREATE TABLE business (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  business_type business_type, -- ENUM type
  agent_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TYPE business_type AS ENUM ('restaurant', 'retail', 'service');

-- Restaurant Details
CREATE TABLE restaurant_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business(id) ON DELETE CASCADE,
    menu_items TEXT,
    seating_capacity INTEGER,
    cuisine_type TEXT,
    operating_hours JSONB,
    delivery_available BOOLEAN DEFAULT false,
    takeout_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Retail Details
CREATE TABLE retail_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business(id) ON DELETE CASCADE,
    store_type TEXT,
    inventory_size INTEGER,
    has_online_store BOOLEAN DEFAULT false,
    operating_hours JSONB,
    delivery_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Service Details
CREATE TABLE service_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES business(id) ON DELETE CASCADE,
    service_type TEXT,
    service_area TEXT,
    is_mobile_service BOOLEAN DEFAULT false,
    requires_booking BOOLEAN DEFAULT false,
    operating_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE business_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES business(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,      -- 'knowledge_base' or 'csv_config'
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

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