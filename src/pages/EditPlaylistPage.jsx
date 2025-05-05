import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components'
import { 
  DeleteRegular,
  PlayRegular,
  AddRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'
import AddVideoDrawer from '../components/AddVideoDrawer'

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalL,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalL,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    '& td': {
      padding: tokens.spacingVerticalM,
    },
    '& td:first-child': {
      paddingRight: tokens.spacingHorizontalL,
    },
    '& td:last-child': {
      paddingLeft: tokens.spacingHorizontalL,
    },
  },
  thumbnail: {
    width: '120px',
    height: '68px',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusSmall,
  },
  thumbnailCell: {
    width: '120px',
    padding: tokens.spacingVerticalS,
    flexShrink: 0,
    paddingRight: tokens.spacingHorizontalL,
  },
  titleCell: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 0,
  },
  titleText: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionsCell: {
    width: '100px',
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    flexShrink: 0,
    height: '100%',
    justifyContent: 'center',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  deleteButton: {
    color: tokens.colorPaletteRedForeground1,
    ':hover': {
      color: tokens.colorPaletteRedForeground2,
    },
  },
})

function EditPlaylistPage() {
  const styles = useStyles()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { deletePlaylist } = usePlaylist()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddVideoDrawerOpen, setIsAddVideoDrawerOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)

  useEffect(() => {
    fetchPlaylist()
  }, [id])

  const fetchPlaylist = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_videos (
            id,
            youtube_url,
            title,
            channel_title,
            thumbnail_url,
            duration
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        throw new Error('Playlist not found')
      }

      // Check if user has permission to edit this playlist
      if (data.user_id !== user.id) {
        throw new Error('You do not have permission to edit this playlist')
      }

      setPlaylist(data)
    } catch (error) {
      console.error('Error fetching playlist:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePlaylist(id)
      navigate('/playlists')
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      setError(error.message)
    }
  }

  const handleDeleteVideo = async (videoId) => {
    try {
      const { error } = await supabase
        .from('playlist_videos')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      setPlaylist(prev => ({
        ...prev,
        playlist_videos: prev.playlist_videos.filter(video => video.id !== videoId)
      }))
      setVideoToDelete(null)
    } catch (error) {
      console.error('Error deleting video:', error.message)
      setError('Failed to delete video. Please try again later.')
    }
  }

  const handleVideoAdded = (newVideo) => {
    setPlaylist(prev => ({
      ...prev,
      playlist_videos: [...(prev.playlist_videos || []), newVideo]
    }))
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading playlist..." />
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className={styles.container}>
        <MessageBar intent="error">
          <MessageBarBody>Playlist not found</MessageBarBody>
        </MessageBar>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {error && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.header}>
        <Title3>{playlist.title}</Title3>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => setIsAddVideoDrawerOpen(true)}
          >
            Add Video
          </Button>
          <Button 
            appearance="subtle" 
            icon={<DeleteRegular />}
            onClick={handleDelete}
          >
            Delete Playlist
          </Button>
        </div>
      </div>

      {playlist.description && (
        <Text className={styles.description}>{playlist.description}</Text>
      )}

      <Table className={styles.table}>
        <TableHeader>
          <TableRow className={styles.tableRow}>
            <TableHeaderCell style={{ width: '120px' }}>Thumbnail</TableHeaderCell>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell style={{ width: '100px' }}>Duration</TableHeaderCell>
            <TableHeaderCell style={{ width: '100px' }}>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playlist.playlist_videos?.map((video) => (
            <TableRow key={video.id} className={styles.tableRow}>
              <TableCell className={styles.thumbnailCell}>
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className={styles.thumbnail}
                />
              </TableCell>
              <TableCell className={styles.titleCell} style={{ paddingLeft: '20px' }}>
                <Text weight="semibold" className={styles.titleText}>{video.title}</Text>
              </TableCell>
              <TableCell>
                <Text>{video.duration || '-'}</Text>
              </TableCell>
              <TableCell className={styles.actionsCell}>
                <Dialog open={videoToDelete?.id === video.id} onOpenChange={(e, data) => {
                  if (!data.open) setVideoToDelete(null)
                }}>
                  <DialogTrigger>
                    <Button
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      onClick={() => setVideoToDelete(video)}
                      className={styles.deleteButton}
                      title="Delete video"
                    />
                  </DialogTrigger>
                  <DialogSurface>
                    <DialogBody>
                      <DialogTitle>Delete Video</DialogTitle>
                      <DialogContent>
                        Are you sure you want to delete "{video.title}" from this playlist?
                      </DialogContent>
                      <DialogActions>
                        <Button appearance="secondary" onClick={() => setVideoToDelete(null)}>
                          Cancel
                        </Button>
                        <Button appearance="primary" onClick={() => handleDeleteVideo(video.id)}>
                          Delete
                        </Button>
                      </DialogActions>
                    </DialogBody>
                  </DialogSurface>
                </Dialog>
                <Button
                  appearance="subtle"
                  icon={<PlayRegular />}
                  onClick={() => window.open(video.youtube_url, '_blank')}
                  title="Watch on YouTube"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddVideoDrawer
        isOpen={isAddVideoDrawerOpen}
        onClose={() => setIsAddVideoDrawerOpen(false)}
        playlistId={id}
        onVideoAdded={handleVideoAdded}
      />
    </div>
  )
}

export default EditPlaylistPage 