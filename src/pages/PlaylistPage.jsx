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
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components'
import { 
  MoreHorizontalRegular,
  DeleteRegular,
  EditRegular,
  PlayRegular,
  AddRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'
import CreatePlaylistDrawer from '../components/CreatePlaylistDrawer'
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
  videoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  videoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
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
  videoCount: {
    color: tokens.colorNeutralForeground3,
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

function PlaylistPage() {
  const styles = useStyles()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { deletePlaylist } = usePlaylist()
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddVideoDrawerOpen, setIsAddVideoDrawerOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)

  useEffect(() => {
    fetchPlaylists()
  }, [id])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('playlists')
        .select(`
          *,
          playlist_videos (
            id,
            youtube_url,
            title,
            channel_title,
            thumbnail_url
          )
        `)

      if (id) {
        // Fetch single playlist with detailed video information
        const { data, error } = await query
          .eq('id', id)
          .single()

        if (error) throw error
        setPlaylists([data])
      } else {
        // Fetch all playlists with video counts
        const { data, error } = await query
          .order('created_at', { ascending: false })

        if (error) throw error
        setPlaylists(data)
      }
    } catch (error) {
      console.error('Error fetching playlists:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePlaylist(id)
      setPlaylists(playlists.filter(playlist => playlist.id !== id))
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      setError(error.message)
    }
  }

  const handlePlaylistCreated = (newPlaylist) => {
    setPlaylists([newPlaylist, ...playlists])
  }

  const handleDeleteVideo = async (videoId) => {
    try {
      const { error } = await supabase
        .from('playlist_videos')
        .delete()
        .eq('id', videoId)

      if (error) throw error

      // Update the playlists state to remove the deleted video
      setPlaylists(prev => prev.map(playlist => ({
        ...playlist,
        playlist_videos: playlist.playlist_videos.filter(video => video.id !== videoId)
      })))
      setVideoToDelete(null) // Close dialog after successful deletion
    } catch (error) {
      console.error('Error deleting video:', error.message)
      setError('Failed to delete video. Please try again later.')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading playlists..." />
      </div>
    )
  }

  // Show all playlists if no specific playlist ID is provided
  if (!id) {
    return (
      <div className={styles.container}>
        {error && (
          <MessageBar intent="error" className={styles.errorMessage}>
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.header}>
          <Title3>My Playlists</Title3>
          <Button 
            appearance="primary" 
            icon={<AddRegular />}
            onClick={() => setIsDrawerOpen(true)}
          >
            Create Playlist
          </Button>
        </div>

        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Videos</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists.map((playlist) => (
              <TableRow key={playlist.id}>
                <TableCell>
                  <Button
                    appearance="subtle"
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                  >
                    {playlist.title}
                  </Button>
                </TableCell>
                <TableCell>{playlist.description || '-'}</TableCell>
                <TableCell>{playlist.playlist_videos?.length || 0}</TableCell>
                <TableCell>
                  {new Date(playlist.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Menu>
                    <MenuTrigger>
                      <Button
                        appearance="subtle"
                        icon={<MoreHorizontalRegular />}
                        aria-label="More actions"
                      />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem
                          icon={<PlayRegular />}
                          onClick={() => navigate(`/playlist/${playlist.id}`)}
                        >
                          View Playlist
                        </MenuItem>
                        <MenuItem
                          icon={<EditRegular />}
                          onClick={() => navigate(`/playlist/${playlist.id}/edit`)}
                        >
                          Edit Playlist
                        </MenuItem>
                        <MenuItem
                          icon={<DeleteRegular />}
                          onClick={() => handleDelete(playlist.id)}
                        >
                          Delete Playlist
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CreatePlaylistDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onPlaylistCreated={() => fetchPlaylists()}
        />
      </div>
    )
  }

  // Show single playlist details if ID is provided
  const playlist = playlists[0]
  if (!playlist) {
    return (
      <div className={styles.container}>
        <MessageBar intent="error">
          <MessageBarBody>Playlist not found</MessageBarBody>
        </MessageBar>
      </div>
    )
  }

  const handleVideoAdded = (newVideo) => {
    setPlaylists(prev => [{
      ...prev[0],
      playlist_videos: [...(prev[0].playlist_videos || []), newVideo]
    }])
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
        {user?.id === playlist.user_id && (
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
              onClick={() => handleDelete(playlist.id)}
            >
              Delete Playlist
            </Button>
          </div>
        )}
      </div>

      {playlist.description && (
        <Text className={styles.description}>{playlist.description}</Text>
      )}

      <Table className={styles.table}>
        <TableHeader>
          <TableRow className={styles.tableRow}>
            <TableHeaderCell style={{ width: '120px' }}>Thumbnail</TableHeaderCell>
            <TableHeaderCell>Title</TableHeaderCell>
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
              <TableCell className={styles.actionsCell}>
                {user?.id === playlist.user_id && (
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
                )}
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

export default PlaylistPage 