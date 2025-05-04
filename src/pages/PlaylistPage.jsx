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
})

function PlaylistPage() {
  const styles = useStyles()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playlists, loading, fetchPlaylists, deletePlaylist, createPlaylist } = usePlaylist()
  const [playlist, setPlaylist] = useState(null)
  const [error, setError] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPlaylist()
    } else {
      fetchPlaylists()
    }
  }, [id, fetchPlaylists])

  const fetchPlaylist = async () => {
    try {
      setError(null)
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_videos (
            *,
            video:youtube_videos (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setPlaylist(data)
    } catch (error) {
      console.error('Error fetching playlist:', error.message)
      setError('Failed to load playlist. Please try again later.')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePlaylist(id)
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      setError('Failed to delete playlist. Please try again later.')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner label="Loading..." />
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
          <Button appearance="primary" onClick={() => setIsDrawerOpen(true)}>
            Create New Playlist
          </Button>
        </div>

        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Thumbnail</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>Videos</TableHeaderCell>
              <TableHeaderCell>Created At</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists.map((playlist) => (
              <TableRow key={playlist.id}>
                <TableCell>
                  <img
                    src={playlist.thumbnail_url || 'https://via.placeholder.com/120x68'}
                    alt={playlist.title}
                    className={styles.thumbnail}
                  />
                </TableCell>
                <TableCell>
                  <Text weight="semibold">{playlist.title}</Text>
                </TableCell>
                <TableCell>
                  <Text className={styles.videoCount}>
                    {playlist.video_count || 0} videos
                  </Text>
                </TableCell>
                <TableCell>
                  <Text>{new Date(playlist.created_at).toLocaleDateString()}</Text>
                </TableCell>
                <TableCell className={styles.actionsCell}>
                  <Menu>
                    <MenuTrigger>
                      <Button appearance="subtle" icon={<MoreHorizontalRegular />} />
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
                          Edit
                        </MenuItem>
                        <MenuItem 
                          icon={<DeleteRegular />}
                          onClick={() => handleDelete(playlist.id)}
                        >
                          Delete
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
          onCreatePlaylist={createPlaylist}
        />
      </div>
    )
  }

  // Show single playlist details if ID is provided
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
        {playlist.playlist_videos?.map(({ video }) => (
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