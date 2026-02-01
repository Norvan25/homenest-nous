import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    // For now, skip auth check during development
    // In production, verify caller is admin using session

    // Get all users from auth.users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error listing users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get roles for all users
    const { data: roles } = await (supabaseAdmin.from('user_roles') as any)
      .select('user_id, role')

    // Merge user data with roles
    const usersWithRoles = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      role: roles?.find((r: any) => r.user_id === u.id)?.role || 'agent',
      user_metadata: u.user_metadata
    }))

    return NextResponse.json({ users: usersWithRoles })
  } catch (error: any) {
    console.error('GET users error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name: name || email.split('@')[0] }
    })

    if (createError) {
      console.error('Create user error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // Create role entry
    const { error: roleError } = await (supabaseAdmin.from('user_roles') as any)
      .insert({
        user_id: newUser.user.id,
        role: role || 'agent',
        permissions: role === 'super_admin' ? ['all'] : []
      })

    if (roleError) {
      console.error('Create role error:', roleError)
      // Rollback user creation if role fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: roleError.message }, { status: 500 })
    }

    // Create preferences entry
    await (supabaseAdmin.from('user_preferences') as any)
      .insert({
        user_id: newUser.user.id,
        current_view: 'agent',
        theme: 'dark'
      })

    // Log the action
    await (supabaseAdmin.from('login_logs') as any)
      .insert({
        user_id: newUser.user.id,
        email: email,
        event_type: 'user_created',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        success: true
      })

    return NextResponse.json({ 
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        role: role || 'agent'
      }
    })
  } catch (error: any) {
    console.error('POST user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
