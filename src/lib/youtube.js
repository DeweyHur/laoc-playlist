const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

const youtube = {
    async getVideoDetails(videoId) {
        const response = await fetch(
            `${BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
        )

        if (!response.ok) {
            throw new Error('Failed to fetch video details')
        }

        const data = await response.json()
        return data
    }
}

export default youtube 