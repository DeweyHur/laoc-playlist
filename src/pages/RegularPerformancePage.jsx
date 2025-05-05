import { useState, useEffect } from 'react'
import {
  Title3,
  Text,
  makeStyles,
  tokens,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Input,
  Textarea,
} from '@fluentui/react-components'
import { 
  EditRegular,
  AddRegular,
  SaveRegular,
  DismissRegular,
} from '@fluentui/react-icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  videoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalL,
  },
  videoCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: '16/9',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusSmall,
  },
  videoInfo: {
    padding: tokens.spacingVerticalM,
  },
  channelInfo: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  errorMessage: {
    marginBottom: tokens.spacingVerticalM,
  },
  description: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
  },
  duration: {
    position: 'absolute',
    bottom: tokens.spacingVerticalS,
    right: tokens.spacingHorizontalS,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: tokens.colorNeutralForegroundInverted,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
  },
  thumbnailContainer: {
    position: 'relative',
  },
})

function RegularPerformancePage() {
  const styles = useStyles()
  const navigate = useNavigate()
  const { user, userProfile, isAdmin, isDevelopment } = useAuth()
  const [performances, setPerformances] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPerformance, setEditedPerformance] = useState(null)

  useEffect(() => {
    // Only redirect if not admin and not in development
    if (!loading && !isAdmin() && !isDevelopment) {
      navigate('/')
    }
  }, [loading, isAdmin, isDevelopment, navigate])

  useEffect(() => {
    fetchPerformances()
  }, [])

  const fetchPerformances = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('regular_performances')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setPerformances(data || [])
    } catch (error) {
      console.error('Error fetching performances:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (performance) => {
    setEditedPerformance({
      id: performance.id,
      title: performance.title,
      description: performance.description || '',
      date: performance.date,
      location: performance.location || '',
      youtube_url: performance.youtube_url || '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('regular_performances')
        .update({
          title: editedPerformance.title,
          description: editedPerformance.description,
          date: editedPerformance.date,
          location: editedPerformance.location,
          youtube_url: editedPerformance.youtube_url,
        })
        .eq('id', editedPerformance.id)
        .select()
        .single()

      if (error) throw error

      setPerformances(performances.map(p => 
        p.id === data.id ? data : p
      ))
      setIsEditing(false)
      setEditedPerformance(null)
    } catch (error) {
      console.error('Error updating performance:', error.message)
      setError(error.message)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedPerformance(null)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Loading performances..." />
      </div>
    )
  }

  // Only check admin access if not in development
  if (!isAdmin() && !isDevelopment) {
    return null // Will redirect in useEffect
  }

  return (
    <div className={styles.container}>
      {error && (
        <MessageBar intent="error" className={styles.errorMessage}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.header}>
        <Title3>정모 공연</Title3>
        <Button 
          appearance="primary" 
          icon={<AddRegular />}
          onClick={() => {/* TODO: Implement add performance */}}
        >
          Add Performance
        </Button>
      </div>

      <div className={styles.grid}>
        {performances.map(performance => (
          <Card key={performance.id} className={styles.videoCard}>
            <CardPreview>
              <div className={styles.thumbnailContainer}>
                {performance.youtube_url && (
                  <img
                    src={`https://img.youtube.com/vi/${getVideoId(performance.youtube_url)}/maxresdefault.jpg`}
                    alt={performance.title}
                    className={styles.thumbnail}
                  />
                )}
              </div>
            </CardPreview>
            <CardHeader>
              <Text weight="semibold">{performance.title}</Text>
              <Text className={styles.channelInfo}>
                {new Date(performance.date).toLocaleDateString()} - {performance.location}
              </Text>
            </CardHeader>
            <CardFooter>
              <Button
                appearance="primary"
                icon={<EditRegular />}
                onClick={() => handleEdit(performance)}
              >
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && editedPerformance && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <Card style={{
            width: '500px',
            maxWidth: '90vw',
            padding: tokens.spacingHorizontalL,
          }}>
            <Title3 style={{ marginBottom: tokens.spacingVerticalM }}>
              Edit Performance
            </Title3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
              <Input
                label="Title"
                value={editedPerformance.title}
                onChange={(e) => setEditedPerformance(prev => ({ ...prev, title: e.target.value }))}
              />
              <Input
                label="Date"
                type="date"
                value={editedPerformance.date}
                onChange={(e) => setEditedPerformance(prev => ({ ...prev, date: e.target.value }))}
              />
              <Input
                label="Location"
                value={editedPerformance.location}
                onChange={(e) => setEditedPerformance(prev => ({ ...prev, location: e.target.value }))}
              />
              <Input
                label="YouTube URL"
                value={editedPerformance.youtube_url}
                onChange={(e) => setEditedPerformance(prev => ({ ...prev, youtube_url: e.target.value }))}
              />
              <Textarea
                label="Description"
                value={editedPerformance.description}
                onChange={(e) => setEditedPerformance(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: tokens.spacingHorizontalS,
              marginTop: tokens.spacingVerticalL,
            }}>
              <Button
                appearance="secondary"
                icon={<DismissRegular />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                icon={<SaveRegular />}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function getVideoId(url) {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

export default RegularPerformancePage 