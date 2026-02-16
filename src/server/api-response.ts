import { NextResponse } from 'next/server'

interface Meta {
  total: number
  page: number
  limit: number
}

interface SuccessBody<T> {
  success: true
  data: T
  meta?: Meta
}

interface ErrorBody {
  success: false
  error: string
}

export type ApiResponse<T> = SuccessBody<T> | ErrorBody

export function successResponse<T>(data: T, meta?: Meta, status = 200) {
  const body: SuccessBody<T> = { success: true, data }
  if (meta) {
    body.meta = meta
  }
  return NextResponse.json(body, { status })
}

export function errorResponse(error: string, status: number) {
  const body: ErrorBody = { success: false, error }
  return NextResponse.json(body, { status })
}
