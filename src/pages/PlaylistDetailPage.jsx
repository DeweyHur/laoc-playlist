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
  description: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
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
  videoInfo: {
    flex: 1,
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  actionsCell: {
    width: '100px',
  },
})

function PlaylistDetailPage() {
  const styles = useStyles()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { deletePlaylist } = usePlaylist()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddVideoDrawerOpen, setIsAddVideoDrawerOpen] = useState(false)

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
          id,
          title,
          description,
          user_id,
          created_at,
          updated_at,
          playlist_videos (
            id,
            youtube_url,
            title,
            channel_title,
            created_at
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setPlaylist(data)
    } catch (error) {
      console.error('Error fetching playlist:', error.message)
      setError('Failed to load playlist. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePlaylist(id)
      navigate('/playlist')
    } catch (error) {
      console.error('Error deleting playlist:', error.message)
      setError('Failed to delete playlist. Please try again later.')
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner label="Loading..." />
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
              onClick={handleDelete}
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
          <TableRow>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Channel</TableHeaderCell>
            <TableHeaderCell>Added At</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {playlist.playlist_videos?.map((video) => (
            <TableRow key={video.id}>
              <TableCell>
                <Text weight="semibold">{video.title}</Text>
              </TableCell>
              <TableCell>
                <Text>{video.channel_title}</Text>
              </TableCell>
              <TableCell>
                <Text>{new Date(video.created_at).toLocaleDateString()}</Text>
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
                        onClick={() => window.open(video.youtube_url, '_blank')}
                      >
                        Watch on YouTube
                      </MenuItem>
                      {user?.id === playlist.user_id && (
                        <MenuItem 
                          icon={<DeleteRegular />}
                          onClick={() => handleDeleteVideo(video.id)}
                        >
                          Remove from Playlist
                        </MenuItem>
                      )}
                    </MenuList>
                  </MenuPopover>
                </Menu>
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

export default PlaylistDetailPage 