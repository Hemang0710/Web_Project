import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { weeklyRefreshService } from '@/app/lib/weeklyRefreshService';

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to trigger refresh' }, { status: 401 });
    }

    const data = await req.json();
    const { userId, refreshAll = false } = data;

    if (refreshAll) {
      // Refresh all users (admin functionality)
      const results = await weeklyRefreshService.refreshAllUsers();
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `Weekly refresh completed: ${successCount} successful, ${errorCount} failed`,
        results
      });
    } else {
      // Refresh specific user
      const targetUserId = userId || token.sub;
      const result = await weeklyRefreshService.refreshUserMealPlan(targetUserId);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Meal plan and grocery list refreshed successfully',
          mealPlanId: result.mealPlanId,
          groceryListId: result.groceryListId
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to refresh meal plan'
        }, { status: 500 });
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to trigger weekly refresh';
    console.error('Error triggering weekly refresh:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req }) as { sub?: string } | null;
    if (!token?.sub) {
      return NextResponse.json({ error: 'Please sign in to view refresh status' }, { status: 401 });
    }

    // Return information about the weekly refresh service
    return NextResponse.json({
      service: 'Weekly Refresh Service',
      description: 'Automatically refreshes meal plans and grocery lists for users',
      endpoints: {
        'POST /api/weekly-refresh': 'Trigger weekly refresh for a user or all users',
        'GET /api/weekly-refresh': 'Get service information'
      },
      parameters: {
        'userId': 'Optional: Specific user ID to refresh (defaults to current user)',
        'refreshAll': 'Optional: Boolean to refresh all users (admin only)'
      }
    });

  } catch (error) {
    console.error('Error getting refresh service info:', error);
    return NextResponse.json(
      { error: 'Failed to get service information' },
      { status: 500 }
    );
  }
} 