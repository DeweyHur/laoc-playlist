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
  Textarea,
  DrawerFooter,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'
import { useAuth } from '../contexts/AuthContext'
import { usePlaylist } from '../contexts/PlaylistContext'

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
})

function CreatePlaylistDrawer({ isOpen, onClose, onPlaylistCreated }) {
  const styles = useStyles()
  const { user } = useAuth()
  const { createPlaylist } = usePlaylist()
  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  const handleCreate = async () => {
    try {
      setIsCreating(true)
      setError(null)
      
      if (!newPlaylist.title.trim()) {
        throw new Error('Title is required')
      }

      const createdPlaylist = await createPlaylist({
        title: newPlaylist.title,
        description: newPlaylist.description,
      })

      // Reset form and close drawer
      setNewPlaylist({
        title: '',
        description: '',
      })
      onClose()
      
      // Notify parent component that playlist was created
      if (onPlaylistCreated) {
        onPlaylistCreated(createdPlaylist)
      }
    } catch (error) {
      console.error('Error creating playlist:', error.message)
      setError(error.message)
    } finally {
      setIsCreating(false)
    }
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
          Create New Playlist
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
            <Label htmlFor="title" required>Title</Label>
            <Input
              id="title"
              value={newPlaylist.title}
              onChange={(e) => setNewPlaylist(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter playlist title"
            />
          </div>

          <div className={styles.formField}>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newPlaylist.description}
              onChange={(e) => setNewPlaylist(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter playlist description"
            />
          </div>
        </div>
      </DrawerBody>

      <DrawerFooter>
        <Button appearance="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          appearance="primary" 
          onClick={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Playlist'}
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}

export default CreatePlaylistDrawer 