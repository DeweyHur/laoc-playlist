import { createClient } from '@googleapis/youtube'

const youtube = createClient({
    version: 'v3',
    auth: process.env.VITE_YOUTUBE_API_KEY,
    defaultTracking: false // Explicitly disable default tracking
})

export default youtube 