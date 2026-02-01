import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      params.id,
      { password: newPassword }
    )

    if (error) {
      console.error('Reset password error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log password reset
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(params.id)
    await (supabaseAdmin.from('login_logs') as any)
      .insert({
        user_id: params.id,
        email: targetUser.user?.email,
        event_type: 'password_reset_by_admin',
        success: true
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
