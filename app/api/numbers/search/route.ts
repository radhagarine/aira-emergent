// app/api/numbers/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTwilioNumbersService } from '@/lib/services/twilio';
import { TwilioNumberSearchParams } from '@/lib/services/twilio/types';
import { BusinessNumberType } from '@/lib/types/database/numbers.types';

export const runtime = 'nodejs';

/**
 * POST /api/numbers/search
 * Search for available phone numbers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryCode, numberType, areaCode, contains } = body;

    // Validate required parameters
    if (!countryCode) {
      return NextResponse.json(
        { error: 'Country code is required' },
        { status: 400 }
      );
    }

    if (!numberType) {
      return NextResponse.json(
        { error: 'Number type is required' },
        { status: 400 }
      );
    }

    // Map our number types to Twilio types
    let twilioNumberType: 'local' | 'tollFree' | 'mobile' = 'local';
    if (numberType === BusinessNumberType.TOLL_FREE || numberType === 'tollFree') {
      twilioNumberType = 'tollFree';
    } else if (numberType === BusinessNumberType.MOBILE || numberType === 'mobile') {
      twilioNumberType = 'mobile';
    }

    // Build search parameters
    const searchParams: TwilioNumberSearchParams = {
      countryCode: countryCode.toUpperCase(),
      numberType: twilioNumberType,
      limit: 20,
    };

    // Add optional filters
    if (areaCode) {
      searchParams.areaCode = areaCode;
    }

    if (contains) {
      searchParams.contains = contains;
    }

    // Search for numbers
    const twilioService = getTwilioNumbersService();
    const results = await twilioService.searchAvailableNumbers(searchParams);

    // Add pricing information to each number
    const numbersWithPricing = results.numbers.map((number) => {
      let businessNumberType = BusinessNumberType.LOCAL;
      if (twilioNumberType === 'tollFree') {
        businessNumberType = BusinessNumberType.TOLL_FREE;
      } else if (twilioNumberType === 'mobile') {
        businessNumberType = BusinessNumberType.MOBILE;
      }

      const pricing = twilioService.getPricing(countryCode.toUpperCase(), businessNumberType);

      return {
        ...number,
        monthlyCost: pricing,
      };
    });

    return NextResponse.json({
      success: true,
      numbers: numbersWithPricing,
      total: numbersWithPricing.length,
    });
  } catch (error: any) {
    console.error('[API /api/numbers/search] Error:', error);

    // Handle Twilio not configured
    if (error.message?.includes('not configured')) {
      return NextResponse.json(
        {
          error: 'Phone number provisioning is not configured. Please contact support.',
          code: 'TWILIO_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to search for phone numbers',
        code: 'SEARCH_FAILED',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/numbers/search
 * Get search endpoint info
 */
export async function GET() {
  return NextResponse.json({
    message: 'Phone number search endpoint',
    method: 'POST',
    parameters: {
      countryCode: 'Required. ISO country code (e.g., US, CA, GB)',
      numberType: 'Required. Type of number (local, tollFree, mobile)',
      areaCode: 'Optional. Area code to search (US/CA only)',
      contains: 'Optional. Pattern to match in phone number',
    },
  });
}
