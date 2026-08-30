import { NextRequest } from 'next/server'
import { proxy } from '../../proxy'

const retired = proxy(new NextRequest('https://devsnack-blog.vercel.app/aitech/post-1784461354'))
if (!retired || retired.status !== 410) throw new Error('retired AI Tech detail must return HTTP 410')

const hub = proxy(new NextRequest('https://devsnack-blog.vercel.app/aitech'))
if (hub !== undefined) throw new Error('AI Tech hub must not be intercepted by the retired detail policy')

console.log('AI Tech proxy tests passed')
