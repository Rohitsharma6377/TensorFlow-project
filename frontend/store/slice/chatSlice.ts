import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChatAPI } from '@/lib/api'

export interface Conversation {
  _id: string
  participants?: string[]
  lastMessage?: any
}

export interface ChatState {
  conversations: Conversation[]
  messages: Record<string, any[]>
  status: 'idle' | 'loading' | 'error'
  error?: string
}

const initialState: ChatState = {
  conversations: [],
  messages: {},
  status: 'idle',
}

export const ensureConversation = createAsyncThunk(
  'chat/ensureConversation',
  async (payload: { participants: string[]; opts?: { orderId?: string; postId?: string; storyId?: string } }) => {
    const res = await ChatAPI.ensureConversation(payload.participants, payload.opts as any)
    return res.conversation
  }
)

export const listConversations = createAsyncThunk('chat/listConversations', async () => {
  const res = await ChatAPI.listConversations()
  return res.conversations || []
})

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (payload: { conversationId: string; page?: number; limit?: number }) => {
    const res = await ChatAPI.getMessages(payload.conversationId, payload.page, payload.limit)
    return { conversationId: payload.conversationId, messages: res.messages || [] }
  }
)

export const sendMessageThunk = createAsyncThunk(
  'chat/sendMessage',
  async (payload: { conversationId: string; text?: string; attachments?: any[] }) => {
    const res = await ChatAPI.sendMessage(payload.conversationId, { text: payload.text, attachments: payload.attachments })
    return { conversationId: payload.conversationId, message: res.message }
  }
)

const slice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(listConversations.pending, (s) => { s.status = 'loading'; s.error = undefined })
      .addCase(listConversations.fulfilled, (s, a: PayloadAction<Conversation[]>) => { s.status = 'idle'; s.conversations = a.payload })
      .addCase(listConversations.rejected, (s, a) => { s.status = 'error'; s.error = a.error.message })

      .addCase(getMessages.fulfilled, (s, a) => {
        s.status = 'idle'
        s.messages[a.payload.conversationId] = a.payload.messages
      })

      .addCase(sendMessageThunk.fulfilled, (s, a) => {
        const arr = s.messages[a.payload.conversationId] || []
        s.messages[a.payload.conversationId] = [...arr, a.payload.message]
      })
  },
})

export default slice.reducer
