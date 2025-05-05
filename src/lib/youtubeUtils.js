/**
 * Extracts the video ID from a YouTube URL
 * @param {string} url - The YouTube URL to parse
 * @returns {string|null} The video ID or null if not found
 */
export const extractVideoId = (url) => {
    if (!url) return null

    // Handle traditional format: https://www.youtube.com/watch?v=VIDEO_ID
    let match = url.match(/[?&]v=([^&]+)/)
    if (match) return match[1]

    // Handle new format: https://youtu.be/VIDEO_ID
    match = url.match(/youtu\.be\/([^?&]+)/)
    if (match) return match[1]

    // Handle embed format: https://www.youtube.com/embed/VIDEO_ID
    match = url.match(/embed\/([^?&]+)/)
    if (match) return match[1]

    return null
}

/**
 * Formats duration from ISO 8601 to human readable format
 * @param {string} duration - ISO 8601 duration string (e.g., PT1H2M3S)
 * @returns {string} Formatted duration (e.g., 1:02:03)
 */
export const formatDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    const hours = (match[1] || '').replace('H', '')
    const minutes = (match[2] || '').replace('M', '')
    const seconds = (match[3] || '').replace('S', '')

    let result = ''
    if (hours) result += `${hours}:`
    result += `${minutes.padStart(2, '0')}:`
    result += seconds.padStart(2, '0')
    return result
} 