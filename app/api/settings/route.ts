import { NextRequest, NextResponse } from 'next/server';
import { SettingsService } from '@/lib/services/settings-service';
import { systemSettingsSchema } from '@/lib/validations/schemas';
import { AuditService } from '@/lib/services/audit-service';

export async function GET() {
  try {
    const settings = await SettingsService.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch system settings', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = systemSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const oldSettings = await SettingsService.getSettings();
    const updated = await SettingsService.updateSettings(validation.data);

    // Audit Log
    await AuditService.log({
      userId: body.userId || 'user_admin',
      action: 'UPDATE_SYSTEM_SETTINGS',
      module: 'System Settings',
      recordId: updated.id,
      oldValue: oldSettings,
      newValue: updated,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update system settings', message: error.message },
      { status: 400 }
    );
  }
}
