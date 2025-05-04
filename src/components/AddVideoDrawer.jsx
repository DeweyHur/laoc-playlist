import { useState } from 'react'
import {
  makeStyles,
  tokens,
  Button,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Input,
  Label,
  DrawerFooter,
  MessageBar,
  MessageBarBody,
  Spinner,
} from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import youtube from '../lib/youtube'

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalL,
  },
})

function AddVideoDrawer({ isOpen, onClose, playlistId, onVideoAdded }) {
  const styles = useStyles()
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState(null)

  const handleAdd = async () => {
    try {
      setIsAdding(true)
      setError(null)
      
      if (!youtubeUrl.trim()) {
        throw new Error('YouTube URL is required')
      }

      // Extract video ID from URL
      const videoId = extractVideoId(youtubeUrl)
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }

      // Fetch video metadata from YouTube API
      const response = await youtube.getVideoDetails(videoId)

      if (!response.items || response.items.length === 0) {
        throw new Error('Video not found')
      }

      const videoData = response.items[0].snippet
      const contentDetails = response.items[0].contentDetails

      // Format duration from ISO 8601 to human readable format
      const formatDuration = (duration) => {
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

      // Add video to playlist with metadata
      const { data, error } = await supabase
        .from('playlist_videos')
        .insert([
          {
            playlist_id: playlistId,
            youtube_url: youtubeUrl,
            title: videoData.title,
            channel_title: videoData.channelTitle,
            thumbnail_url: videoData.thumbnails.high.url,
            duration: formatDuration(contentDetails.duration)
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Reset form and close drawer
      setYoutubeUrl('')
      onClose()
      if (onVideoAdded) {
        onVideoAdded(data)
      }
    } catch (error) {
      console.error('Error adding video:', error.message)
      setError(error.message)
    } finally {
      setIsAdding(false)
    }
  }

  const extractVideoId = (url) => {
    if (!url) return null
    
    // Handle traditional format: https://www.youtube.com/watch?v=VIDEO_ID
    let match = url.match(/v=([^&]+)/)
    if (match) return match[1]
    
    // Handle new format: https://youtu.be/VIDEO_ID?feature=shared
    match = url.match(/youtu\.be\/([^?]+)/)
    if (match) return match[1]
    
    return null
  }

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(e, data) => onClose()}
      position="end"
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          Add Video to Playlist
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        {error && (
          <MessageBar intent="error" className={styles.errorMessage}>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.form}>
          <div className={styles.formField}>
            <Label htmlFor="youtubeUrl" required>YouTube URL</Label>
            <Input
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>
        </div>

        {isAdding && (
          <div className={styles.loadingContainer}>
            <Spinner label="Fetching video information..." />
          </div>
        )}
      </DrawerBody>

      <DrawerFooter>
        <Button appearance="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          appearance="primary" 
          onClick={handleAdd}
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : 'Add Video'}
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}

export default AddVideoDrawer 