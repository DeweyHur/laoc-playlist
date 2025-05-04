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
  videoInfo: {
    flex: 1,
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  actionsCell: {
    width: '100px',
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
          .eq('user_id', user.id)
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
          <Button appearance="subtle" onClick={() => handleDelete(playlist.id)}>
            Delete Playlist
          </Button>
        )}
      </div>

      <div className={styles.videoList}>
        {playlist.playlist_videos?.map((video) => (
          <div key={video.id} className={styles.videoItem}>
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className={styles.thumbnail}
            />
            <div className={styles.videoInfo}>
              <Text weight="semibold">{video.title}</Text>
              <Text size={200}>{video.channel_title}</Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PlaylistPage 