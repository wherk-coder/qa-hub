import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Attachment } from '@/types'

export async function POST(req: NextRequest) {
  const { test_plan_id, attachment } = await req.json()

  if (!test_plan_id || !attachment) {
    return NextResponse.json({ error: 'test_plan_id and attachment are required' }, { status: 400 })
  }

  const { data: current, error: fetchError } = await supabase
    .from('qa_test_plans')
    .select('attachments')
    .eq('id', test_plan_id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const currentAttachments: Attachment[] = current.attachments || []
  const newAttachments = [...currentAttachments, attachment]

  const { data, error } = await supabase
    .from('qa_test_plans')
    .update({ attachments: newAttachments })
    .eq('id', test_plan_id)
    .select('attachments')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { test_plan_id, path } = await req.json()

  if (!test_plan_id || !path) {
    return NextResponse.json({ error: 'test_plan_id and path are required' }, { status: 400 })
  }

  // Remove from storage (best-effort)
  await supabase.storage.from('qa-attachments').remove([path])

  const { data: current, error: fetchError } = await supabase
    .from('qa_test_plans')
    .select('attachments')
    .eq('id', test_plan_id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  const newAttachments = ((current.attachments as Attachment[]) || []).filter(
    (a: Attachment) => a.path !== path
  )

  const { data, error } = await supabase
    .from('qa_test_plans')
    .update({ attachments: newAttachments })
    .eq('id', test_plan_id)
    .select('attachments')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
