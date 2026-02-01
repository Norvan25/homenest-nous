import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user: targetUser }, error } = await supabaseAdmin.auth.admin.getUserById(params.id)

    if (error || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: userRole } = await (supabaseAdmin.from('user_roles') as any)
      .select('role, permissions')
      .eq('user_id', params.id)
      .single()

    return NextResponse.json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        created_at: targetUser.created_at,
        last_sign_in_at: targetUser.last_sign_in_at,
        role: userRole?.role || 'agent',
        permissions: userRole?.permissions || [],
        user_metadata: targetUser.user_metadata
      }
    })
  } catch (error: any) {
    console.error('GET user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { email, password, role, name } = body

    // Update auth user
    const updateData: any = {}
    if (email) updateData.email = email
    if (password) updateData.password = password
    if (name) updateData.user_metadata = { name }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        params.id,
        updateData
      )

      if (updateError) {
        console.error('Update user error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Update role if provided
    if (role) {
      const { error: roleError } = await (supabaseAdmin.from('user_roles') as any)
        .upsert({
          user_id: params.id,
          role,
          permissions: role === 'super_admin' ? ['all'] : []
        }, {
          onConflict: 'user_id'
        })

      if (roleError) {
        console.error('Update role error:', roleError)
        return NextResponse.json({ error: roleError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PATCH user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if target is super_admin
    const { data: targetRole } = await (supabaseAdmin.from('user_roles') as any)
      .select('role')
      .eq('user_id', params.id)
      .single()

    if (targetRole?.role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot delete super admin' }, { status: 403 })
    }

    // Delete user role and preferences first
    await (supabaseAdmin.from('user_roles') as any).delete().eq('user_id', params.id)
    await (supabaseAdmin.from('user_preferences') as any).delete().eq('user_id', params.id)
    await (supabaseAdmin.from('user_sidebar_pins') as any).delete().eq('user_id', params.id)

    // Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id)

    if (error) {
      console.error('Delete user error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
