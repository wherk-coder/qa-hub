import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { test_plan_id, attachment } = await req.json()

  if (!test_plan_id || !attachment) {
    return NextResponse.json({ error: 'test_plan_id and attachment are required' }, { status: 400 })
  }

  // Use atomic Postgres RPC to append attachment, avoiding TOCTOU race
  const { data, error } = await supabase.rpc('append_attachment', {
    p_test_plan_id: test_plan_id,
    p_attachment: attachment,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attachments: data })
}

export async function DELETE(req: NextRequest) {
  const { test_plan_id, path } = await req.json()

  if (!test_plan_id || !path) {
    return NextResponse.json({ error: 'test_plan_id and path are required' }, { status: 400 })
  }

  // Remove from storage (best-effort)
  await supabase.storage.from('qa-attachments').remove([path])

  // Use atomic Postgres RPC to remove attachment, avoiding TOCTOU race
  const { data, error } = await supabase.rpc('remove_attachment', {
    p_test_plan_id: test_plan_id,
    p_path: path,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ attachments: data })
}
