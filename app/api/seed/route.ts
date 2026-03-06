import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/seed — seeds initial data. Safe to call multiple times (idempotent).
export async function POST() {
  try {
    // 1. Create qa_users
    const { data: existingUsers } = await supabase
      .from('qa_users')
      .select('email')
      .in('email', ['lee@wherk.com', 'cmacatangay3433@gmail.com'])

    const existingEmails = new Set((existingUsers || []).map((u: { email: string }) => u.email))

    const usersToInsert = []
    if (!existingEmails.has('lee@wherk.com')) {
      usersToInsert.push({ email: 'lee@wherk.com', name: 'Lee', role: 'admin' })
    }
    if (!existingEmails.has('cmacatangay3433@gmail.com')) {
      usersToInsert.push({ email: 'cmacatangay3433@gmail.com', name: 'CM', role: 'tester' })
    }

    let users: { id: string; email: string }[] = []
    if (usersToInsert.length > 0) {
      const { data, error } = await supabase
        .from('qa_users')
        .insert(usersToInsert)
        .select('id, email')
      if (error) throw new Error(`Users insert: ${error.message}`)
      users = data || []
    }

    // Get all users for reference
    const { data: allUsers } = await supabase
      .from('qa_users')
      .select('id, email')
      .in('email', ['lee@wherk.com', 'cmacatangay3433@gmail.com'])

    const leeUser = (allUsers || []).find((u: { id: string; email: string }) => u.email === 'lee@wherk.com')
    const cmUser = (allUsers || []).find((u: { id: string; email: string }) => u.email === 'cmacatangay3433@gmail.com')

    // 2. Create project
    const { data: existingProject } = await supabase
      .from('qa_projects')
      .select('id')
      .eq('name', 'HabitRival')
      .maybeSingle()

    let projectId = existingProject?.id
    if (!projectId) {
      const { data: newProject, error } = await supabase
        .from('qa_projects')
        .insert({ name: 'HabitRival', github_repo: 'wherk-coder/habitrival' })
        .select('id')
        .single()
      if (error) throw new Error(`Project insert: ${error.message}`)
      projectId = newProject.id
    }

    // 3. Assign members
    if (leeUser) {
      const { data: existingMember } = await supabase
        .from('qa_project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', leeUser.id)
        .maybeSingle()
      if (!existingMember) {
        await supabase.from('qa_project_members').insert({
          project_id: projectId, user_id: leeUser.id, role: 'admin'
        })
      }
    }
    if (cmUser) {
      const { data: existingMember } = await supabase
        .from('qa_project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', cmUser.id)
        .maybeSingle()
      if (!existingMember) {
        await supabase.from('qa_project_members').insert({
          project_id: projectId, user_id: cmUser.id, role: 'tester'
        })
      }
    }

    // 4. Seed test cases
    const { data: existingTests } = await supabase
      .from('qa_test_plans')
      .select('id')
      .eq('project_id', projectId)

    if ((existingTests || []).length === 0) {
      const testCases = [
        {
          project_id: projectId,
          section: 'Authentication',
          test_id: 'AUTH-001',
          test_name: 'User Login with valid credentials',
          preconditions: 'User has a registered account',
          steps: '1. Navigate to login page\n2. Enter valid email and password\n3. Click Sign In',
          expected_result: 'User is redirected to dashboard and sees their habit list',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Authentication',
          test_id: 'AUTH-002',
          test_name: 'User Login with invalid password',
          preconditions: 'User has a registered account',
          steps: '1. Navigate to login page\n2. Enter valid email and wrong password\n3. Click Sign In',
          expected_result: 'Error message "Invalid credentials" is displayed, user stays on login page',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Authentication',
          test_id: 'AUTH-003',
          test_name: 'New user registration flow',
          preconditions: 'Email not already registered',
          steps: '1. Navigate to signup page\n2. Fill in email, username, password\n3. Accept terms\n4. Click Create Account',
          expected_result: 'Account created, email verification sent, user redirected to onboarding',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Authentication',
          test_id: 'AUTH-004',
          test_name: 'Password reset via email',
          preconditions: 'User has a registered account',
          steps: '1. Click "Forgot Password" on login\n2. Enter registered email\n3. Click Submit\n4. Check email and click reset link\n5. Enter new password',
          expected_result: 'Password reset email received within 1 min, new password works on next login',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Habit Management',
          test_id: 'HAB-001',
          test_name: 'Create a new daily habit',
          preconditions: 'User is logged in',
          steps: '1. Tap "+ Add Habit"\n2. Enter habit name "Drink water"\n3. Select frequency: Daily\n4. Choose icon and color\n5. Tap Save',
          expected_result: 'Habit appears in the habit list with correct name, icon, and frequency',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Habit Management',
          test_id: 'HAB-002',
          test_name: 'Edit an existing habit',
          preconditions: 'User has at least one habit created',
          steps: '1. Long press on an existing habit\n2. Select "Edit"\n3. Change the habit name\n4. Save changes',
          expected_result: 'Habit name is updated in the list and in habit detail view',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Habit Management',
          test_id: 'HAB-003',
          test_name: 'Delete a habit',
          preconditions: 'User has at least one habit',
          steps: '1. Long press on habit\n2. Select "Delete"\n3. Confirm deletion in dialog',
          expected_result: 'Habit removed from list, all associated history deleted',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Daily Tracking',
          test_id: 'TRACK-001',
          test_name: 'Mark habit as complete for today',
          preconditions: 'User has habits set up, it is current day',
          steps: '1. Open app\n2. Tap checkbox next to a habit\n3. Observe UI feedback',
          expected_result: 'Habit marked with checkmark, XP awarded, streak count increments',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Daily Tracking',
          test_id: 'TRACK-002',
          test_name: 'Undo completed habit same day',
          preconditions: 'User has marked a habit complete today',
          steps: '1. Tap the completed habit checkbox again\n2. Confirm undo',
          expected_result: 'Habit returns to incomplete state, XP deducted, streak recalculated',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Streaks',
          test_id: 'STREAK-001',
          test_name: 'Streak increments on consecutive days',
          preconditions: 'User has completed habit for 2+ consecutive days',
          steps: '1. Complete habit on Day 1\n2. Complete habit on Day 2\n3. Check streak counter',
          expected_result: 'Streak shows correct count (e.g., 2), flame icon animates',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Streaks',
          test_id: 'STREAK-002',
          test_name: 'Streak resets when habit missed',
          preconditions: 'User has an active streak of 5+ days',
          steps: '1. Do NOT complete habit on a day\n2. Check app the following day',
          expected_result: 'Streak counter resets to 0 or 1, notification sent about broken streak',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Rewards & Points',
          test_id: 'REWARD-001',
          test_name: 'XP awarded for habit completion',
          preconditions: 'User is logged in with habits',
          steps: '1. Note current XP total\n2. Complete a habit\n3. Check XP total',
          expected_result: 'XP increases by correct amount per habit, level progress bar updates',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Rewards & Points',
          test_id: 'REWARD-002',
          test_name: 'Level up notification triggers',
          preconditions: 'User is close to leveling up (check XP thresholds)',
          steps: '1. Complete enough habits to cross level threshold\n2. Observe app behavior',
          expected_result: 'Level up animation plays, new level badge displayed, special notification sent',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Social Features',
          test_id: 'SOCIAL-001',
          test_name: 'Add a friend via username search',
          preconditions: 'Two test accounts exist',
          steps: '1. Navigate to Friends tab\n2. Search for friend\'s username\n3. Send friend request\n4. Accept from other account',
          expected_result: 'Both users see each other in friends list, can view each other\'s progress',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Settings',
          test_id: 'SETTINGS-001',
          test_name: 'Update notification preferences',
          preconditions: 'User is logged in, notifications permission granted',
          steps: '1. Go to Settings > Notifications\n2. Toggle daily reminder ON\n3. Set time to 8:00 AM\n4. Save settings',
          expected_result: 'Notification preference saved, reminder notification fires at 8:00 AM',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Profile',
          test_id: 'PROFILE-001',
          test_name: 'Update profile display name and avatar',
          preconditions: 'User is logged in',
          steps: '1. Navigate to Profile\n2. Tap Edit\n3. Change display name\n4. Upload new avatar image\n5. Save',
          expected_result: 'New name and avatar visible in profile and in friend feeds',
          result: 'untested',
        },
        {
          project_id: projectId,
          section: 'Notifications',
          test_id: 'NOTIF-001',
          test_name: 'Push notification received for friend activity',
          preconditions: 'User has friends, notifications enabled',
          steps: '1. Have test friend complete a habit\n2. Wait for notification\n3. Tap notification',
          expected_result: 'Push notification received within 30s, tapping opens friend\'s profile',
          result: 'untested',
        },
      ]

      const { error } = await supabase.from('qa_test_plans').insert(testCases)
      if (error) throw new Error(`Test cases insert: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Seed completed',
      project_id: projectId,
      users_created: users.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
