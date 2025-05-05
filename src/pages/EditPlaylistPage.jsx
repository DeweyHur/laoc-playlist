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
  Input,
  Textarea,
} from '@fluentui/react-components'
import {
  DeleteRegular,
  AddRegular,
  ReOrderDotsHorizontalRegular,
  SaveRegular,
  DismissRegular,
  ArrowLeftRegular,
} from '@fluentui/react-icons'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
    marginTop: tokens.spacingVerticalL,
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
  dragHandle: {
    cursor: 'grab',
    color: tokens.colorNeutralForeground3,
    ':hover': {
      color: tokens.colorNeutralForeground1,
    },
  },
  description: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
  },
})

function SortableTableRow({ video, onDelete, videoToDelete, setVideoToDelete, styles }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={styles.tableRow}
    >
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
        >
          <ReOrderDotsHorizontalRegular />
        </div>
      </TableCell>
      <TableCell className={styles.thumbnailCell}>
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className={styles.thumbnail}
        />
      </TableCell>
      <TableCell className={styles.titleCell}>
        <Text weight="semibold" className={styles.titleText}>
          {video.title}
        </Text>
        <Text className={styles.channelInfo}>
          {video.channel_title}
        </Text>
      </TableCell>
      <TableCell>
        <Text className={styles.duration}>
          {video.duration || '-'}
        </Text>
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
                <Button appearance="primary" onClick={() => onDelete(video.id)}>
                  Delete
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </TableCell>
    </TableRow>
  )
}

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
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlaylist, setEditedPlaylist] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
            duration,
            "order"
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

      // Sort videos by order
      data.playlist_videos = data.playlist_videos.sort((a, b) => a.order - b.order)
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

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setPlaylist(prev => {
        const oldIndex = prev.playlist_videos.findIndex((item) => item.id === active.id)
        const newIndex = prev.playlist_videos.findIndex((item) => item.id === over.id)
        const newVideos = arrayMove(prev.playlist_videos, oldIndex, newIndex)

        // Update the order in the database
        const updates = newVideos.map((video, index) => ({
          id: video.id,
          order: index,
          playlist_id: video.playlist_id // Use the existing playlist_id from the video
        }))

        // Update each video individually to ensure RLS policy is satisfied
        Promise.all(updates.map(update =>
          supabase
            .from('playlist_videos')
            .update({ order: update.order })
            .eq('id', update.id)
        ))
          .then((results) => {
            const hasError = results.some(result => result.error)
            if (hasError) {
              console.error('Error updating video order:', results.find(r => r.error)?.error)
              setError('Failed to update video order. Please try again.')
              // Revert the order in the UI if the update fails
              setPlaylist(prev)
            }
          })

        return {
          ...prev,
          playlist_videos: newVideos
        }
      })
    }
  }

  const handleEdit = () => {
    if (playlist) {
      setEditedPlaylist({
        title: playlist.title,
        description: playlist.description || '',
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .update({
          title: editedPlaylist.title,
          description: editedPlaylist.description,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setPlaylist(data)
      setIsEditing(false)
      setEditedPlaylist(null)
    } catch (error) {
      console.error('Error updating playlist:', error.message)
      setError(error.message)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedPlaylist(null)
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
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center' }}>
          <Button
            appearance="subtle"
            icon={<ArrowLeftRegular />}
            onClick={() => navigate(`/playlist/${id}`)}
          >
            Back to Playlist
          </Button>
          {isEditing ? (
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, alignItems: 'center', flex: 1 }}>
              <Input
                value={editedPlaylist.title}
                onChange={(e) => setEditedPlaylist(prev => ({ ...prev, title: e.target.value }))}
                style={{ flex: 1 }}
              />
            </div>
          ) : (
            <Title3>{playlist.title}</Title3>
          )}
        </div>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          {isEditing ? (
            <>
              <Button
                appearance="primary"
                icon={<SaveRegular />}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Textarea
          value={editedPlaylist.description}
          onChange={(e) => setEditedPlaylist(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter playlist description"
          style={{ marginBottom: tokens.spacingVerticalL }}
        />
      ) : (
        playlist.description && (
          <Text className={styles.description}>{playlist.description}</Text>
        )
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table className={styles.table}>
          <TableHeader>
            <TableRow className={styles.tableRow}>
              <TableHeaderCell style={{ width: '40px' }}></TableHeaderCell>
              <TableHeaderCell style={{ width: '120px' }}>Thumbnail</TableHeaderCell>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell style={{ width: '100px' }}>Duration</TableHeaderCell>
              <TableHeaderCell style={{ width: '100px' }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={playlist.playlist_videos.map(video => video.id)}
              strategy={verticalListSortingStrategy}
            >
              {playlist.playlist_videos.map((video) => (
                <SortableTableRow
                  key={video.id}
                  video={video}
                  onDelete={handleDeleteVideo}
                  videoToDelete={videoToDelete}
                  setVideoToDelete={setVideoToDelete}
                  styles={styles}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>

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